from base64 import urlsafe_b64encode
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from email_validator import EmailSyntaxError, EmailUndeliverableError

import morepath
from morepath import redirect

from .app import App
from .collection import UserCollection, GroupCollection
from .model import Root, Login, User, Group, ConfirmEmail


@App.json(model=Root)
def root_default(self, request):
    return redirect('/api/users')


@App.json(model=Login, request_method='POST')
def login(self, request):
    email = request.json['email']
    password = request.json['password']

    validation_service = request.app.service(name='email_validation')

    try:
        normalized_email = validation_service.validate_email(email)

    except EmailSyntaxError:
        @request.after
        def after(response):
            response.status = 409

        return {
            'integrityError': 'Not valid email'
        }

    ph = PasswordHasher()
    u = User.get(email=normalized_email)
    valid_credentials = False
    if u:
        try:
            ph.verify(u.password, password)
        except VerifyMismatchError:
            pass
        else:
            valid_credentials = True

    if valid_credentials and u.email_confirmed:
        @request.after
        def remember(response):
            admin = Group.get(name='Admin')
            is_admin = False
            # Checks if user is member of Admin group or a group to which
            # belong Admin group (recursive).
            if u.groups and admin:
                is_admin = admin in u.groups.basegroups
            identity = morepath.Identity(email, nickname=u.nickname,
                                         language=u.language, isAdmin=is_admin)
            request.app.remember_identity(response, request, identity)

        return {
            '@id': request.class_link(User, variables={'id': u.id}),
            '@type': request.class_link(UserCollection)
        }

    elif valid_credentials:
        @request.after
        def email_not_confirmed(response):
            response.status_code = 403

        return {
            'validationError': 'Your email address has not been confirmed yet'
        }

    else:
        @request.after
        def credentials_not_valid(response):
            response.status_code = 403

        return {'validationError': 'Invalid username or password'}


@App.json(model=User)
def user_get(self, request):
    return {
        '@id': request.link(self),
        '@type': request.class_link(UserCollection),
        'nickname': self.nickname,
        'email': self.email,
        'email_confirmed': self.email_confirmed,
        'language': self.language,
        'groups': [group.name for group in self.groups],
    }


@App.html(model=ConfirmEmail)
def confirm_email(self, request):
    u = User[self.id]
    token = self.token
    token_service = request.app.service(name='token')
    base_url = request.host_url
    path = '/'
    flash_type = 'info'
    if u.email_confirmed:
        flash = 'Your email is already confirmed. Please log in.'
        path = '/login'
    else:
        if token_service.validate(token, 'email-confirmation-salt'):
            u.email_confirmed = True
            flash = 'Thank you for confirming your email address.'
            flash_type = 'success'
        else:
            flash = 'The confirmation link is invalid or has expired.'
            flash_type = 'error'
            path = '/register'

    flash = urlsafe_b64encode(
        flash.encode('utf-8')
    ).replace(b'=', b'').decode('utf-8')

    query = '?flash=' + flash + '&flashtype=' + flash_type
    return morepath.redirect(base_url + path + query)


@App.json(model=UserCollection)
def user_collection_get(self, request):
    return {
        'users': [request.view(user) for user in self.query()]
    }


@App.json(model=UserCollection, request_method='POST')
def user_collection_add(self, request):
    nickname = request.json.get('nickname')
    email = request.json.get('email')
    password = request.json.get('password')
    locale_settings = request.app.settings.locale
    preferred_language = request.accept_language.best_match(
        locale_settings.accepted_languages,
        default_match=locale_settings.default_language
    )
    language = request.json.get('language', preferred_language)
    group_ids = request.json.get('groups', [])
    creation_ip = request.remote_addr

    validation_service = request.app.service(name='email_validation')

    try:
        normalized_email = validation_service.validate_email(email, True)

    except EmailSyntaxError:
        @request.after
        def after(response):
            response.status = 409

        return {
            'integrityError': 'Not valid email'
        }

    except EmailUndeliverableError:
        @request.after
        def after(response):
            response.status = 409

        return {
            'integrityError': 'Email could not be delivered'
        }

    else:
        if not User.exists(email=normalized_email):
            user = self.add(
                nickname=nickname, email=normalized_email, password=password,
                language=language, creation_ip=creation_ip, group_ids=group_ids
            )

            @request.after
            def after(response):
                request.app.signal.emit('user.created', user, request)
                response.status = 201

            return {
                '@id': request.class_link(User, variables={'id': user.id}),
                '@type': request.class_link(UserCollection)
            }

        else:
            @request.after
            def after(response):
                response.status = 409

            return {
                'integrityError': 'Email already exists'
            }


@App.json(model=User, request_method='PUT')
def user_update(self, request):
    self.update(request.json)


@App.json(model=User, request_method='DELETE')
def user_remove(self, request):
    self.remove()


@App.json(model=Group)
def group_get(self, request):
    return {
        '@id': request.link(self),
        '@type': request.class_link(GroupCollection),
        'name': self.name,
        'basegroups': [group.name for group in self.basegroups],
        'subgroups': [group.name for group in self.subgroups],
        'users': [user.nickname for user in self.users]
    }


@App.json(model=GroupCollection)
def group_collection_get(self, request):
    return {
        'groups': [request.view(group) for group in self.query()]
    }


@App.json(model=GroupCollection, request_method='POST')
def group_collection_add(self, request):
    name = request.json.get('name')
    basegroup_ids = request.json.get('basegroups', [])

    if not Group.exists(name=name):
        group = self.add(name=name, basegroup_ids=basegroup_ids)

        @request.after
        def after(response):
            response.status = 201

        return {
            '@id': request.class_link(Group, variables={'id': group.id}),
            '@type': request.class_link(GroupCollection)
        }

    else:
        @request.after
        def after(response):
            response.status = 409

        return {
            'integrityError': 'Group already exists'
        }


@App.json(model=Group, request_method='PUT')
def group_update(self, request):
    self.update(request.json)


@App.json(model=Group, request_method='DELETE')
def group_remove(self, request):
    self.remove()

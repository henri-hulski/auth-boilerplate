import {sequence} from 'cerebral'
import {state, string} from 'cerebral/tags'
import {set, when} from 'cerebral/operators'
import {isValidForm} from 'cerebral-provider-forms/operators'
import {httpPost, httpPut} from 'cerebral-provider-http/operators'
import showFlash from '../../common/factories/showFlash'
import showValidationError from '../../common/factories/showValidationError'

export default sequence('Update email address', [
  isValidForm(state`settings.emailForm`), {
    true: [
      when(
        state`user.email`, state`settings.emailForm.email.value`,
        (currentEmail, email) => currentEmail !== email
      ), {
        true: [
          set(state`settings.emailForm.isLoading`, true),
          httpPost('/login', {
            email: state`user.email`,
            password: state`settings.emailForm.password.value`
          }), {
            success: [
              httpPut(string`${state`user.api.@id`}`, {
                email: state`settings.emailForm.email.value`
              }), {
                success: [
                  set(state`user.email`, state`settings.emailForm.email.value`),
                  set(state`settings.emailForm.showErrors`, false),
                  set(state`settings.passwordForm.password.value`, ''),
                  set(state`settings.emailForm.isLoading`, false),
                  showFlash(
                    'Please check your email to confirm your new email address',
                    'success'
                  )
                ],
                error: [
                  set(state`settings.emailForm.showErrors`, false),
                  set(state`settings.emailForm.password.value`, ''),
                  set(state`settings.emailForm.isLoading`, false),
                  showValidationError('Could not update email!')
                ]
              }
            ],
            error: [
              set(state`settings.emailForm.showErrors`, false),
              set(state`settings.emailForm.password.value`, ''),
              set(state`settings.emailForm.isLoading`, false),
              showFlash('Password is not correct - please try again', 'error')
            ]
          }
        ],
        false: showFlash(
          'This email address is the same as your current email',
          'warning'
        )
      }
    ],
    false: set(state`settings.emailForm.showErrors`, true)
  }
])
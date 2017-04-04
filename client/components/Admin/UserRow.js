import React from 'react'
import {connect} from 'cerebral/react'
import {state, props, signal} from 'cerebral/tags'
import {Table, Button, Icon} from 'semantic-ui-react'
import ConfirmSignOut from './ConfirmSignOut'
import ConfirmRemoveUser from './ConfirmRemoveUser'

export default connect({
  user: state`admin.users.${props`uid`}`,
  signOutButtonClicked: signal`admin.signOutButtonClicked`,
  removeUserButtonClicked: signal`admin.removeUserButtonClicked`,
  toggleAdminClicked: signal`admin.toggleAdminClicked`
},
  function UserRow ({
    uid, user, signOutButtonClicked, removeUserButtonClicked, toggleAdminClicked
  }) {
    return (
      <Table.Row>
        <Table.Cell collapsing textAlign='center'>
          <Button inverted
            icon={<Icon name='sign out' size='large' />}
            color='yellow'
            onClick={() => signOutButtonClicked({uid})}
          />
          <ConfirmSignOut />
          {user.nickname !== 'Admin' &&
            <Button inverted
              icon={<Icon name='remove user' size='large' />}
              color='red'
              onClick={() => removeUserButtonClicked({uid})}
            />
          }
          <ConfirmRemoveUser />
        </Table.Cell>
        <Table.Cell>{user.nickname}</Table.Cell>
        <Table.Cell>{user.email}</Table.Cell>
        <Table.Cell textAlign='center'
          icon={user.emailConfirmed
            ? <Icon name='checkmark' color='green' size='large' />
            : <Icon name='remove' color='red' size='large' />
          }
        />
        <Table.Cell textAlign='center'>
          <Button inverted basic color='blue'
            disabled={user.nickname === 'Admin'}
            icon={user.isAdmin
              ? <Icon name='checkmark' color='green' size='large' />
              : <Icon name='remove' color='red' size='large' />
            }
            onClick={() => toggleAdminClicked({uid})}
          />
        </Table.Cell>
        <Table.Cell>{user.language}</Table.Cell>
        <Table.Cell>{user.lastLogin}</Table.Cell>
        <Table.Cell>{user.registered}</Table.Cell>
        <Table.Cell>{user.registerIP}</Table.Cell>
      </Table.Row>
    )
  }
)
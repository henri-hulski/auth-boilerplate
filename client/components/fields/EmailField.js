import React from 'react'
import { connect } from 'cerebral/react'
import { state, props, signal } from 'cerebral/tags'
import { field } from '@cerebral/forms'
import { Form, Input, Label } from 'semantic-ui-react'
import { hasError, showError } from './utils'

export default connect(
  {
    field: field(state`${props`path`}`),
    fieldChanged: signal`user.fieldChanged`,
  },
  function EmailField({ path, showErrors, field, fieldChanged }) {
    return (
      <Form.Field error={hasError(field, showErrors)}>
        <Input
          icon="mail"
          iconPosition="left"
          placeholder="email address"
          value={field.value}
          onChange={(e, { value }) => fieldChanged({ path, value })}
        />
        <Label
          pointing
          basic
          color="red"
          style={{
            display: showError(field, showErrors) ? 'inline-block' : 'none',
          }}
        >
          {field.errorMessage}
        </Label>
      </Form.Field>
    )
  }
)

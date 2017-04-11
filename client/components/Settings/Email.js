import React from 'react'
import {connect} from 'cerebral/react'
import {state, signal} from 'cerebral/tags'
import {Grid, Header, Form, Segment, Button, Dimmer, Message, Loader, List}
    from 'semantic-ui-react'
import {PasswordField, EmailField} from '../fields'

export default connect({
  emailForm: state`settings.emailForm`,
  currentEmail: state`user.email`,
  formSubmitted: signal`settings.emailFormSubmitted`
},
  function UpdateEmail ({emailForm, currentEmail, formSubmitted}) {
    const handleSubmit = (event) => {
      event.preventDefault()
      formSubmitted()
    }
    return (
      <Grid.Column>
        <Header inverted as='h2' textAlign='center'>
          Update your email
        </Header>
        <Form size='large'>
          <Segment>
            <Dimmer
              inverted
              active={emailForm.isLoading}
            >
              <Loader />
            </Dimmer>
            <Message info>
              <Message.Header>
                Your email address will be updated immediately
              </Message.Header>
              <p>Remember to confirm the new email if you
              want to be able to reset your password.</p>
            </Message>
            <List relaxed>
              <List.Item>
                <List.Header>
                  Current email address
                </List.Header>
                <List.Icon name='mail' color='blue' />
                <List.Content>
                  {currentEmail}
                </List.Content>
              </List.Item>
              <List.Item>
                <List.Header>
                  New email adress
                </List.Header>
                <EmailField form={emailForm} path={'settings.emailForm.email'} />
              </List.Item>
              <List.Item>
                <List.Header>
                  Password
                </List.Header>
                <PasswordField
                  form={emailForm}
                  path={'settings.emailForm.password'}
                />
              </List.Item>
            </List>
            <Button
              fluid size='large'
              color='blue'
              onClick={handleSubmit}
            >
              Update email
            </Button>
          </Segment>
        </Form>
      </Grid.Column>
    )
  }
)
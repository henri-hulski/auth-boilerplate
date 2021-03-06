import { sequence } from 'cerebral'
import { state, props } from 'cerebral/tags'
import { set, equals, debounce } from 'cerebral/operators'

import * as actions from './actions'

const showFlashDebounce = debounce.shared()

/* istanbul ignore next */
const flashTimeOut = process.env.NODE_ENV !== 'test' ? 7000 : 10

export function showFlash(flash, flashType = null, ms = flashTimeOut) {
  return sequence('Show flash', [
    set(state`flash`, flash),
    set(state`flashType`, flashType),
    showFlashDebounce(ms),
    {
      continue: [set(state`flash`, null), set(state`flashType`, null)],
      discard: [],
    },
  ])
}

export function showValidationError(defaultErrorMessage) {
  return sequence('Show validation error', [
    equals(props`error.response.status`),
    {
      403: set(
        props`errorMessages`,
        props`error.response.result.validationError`
      ),
      409: set(
        props`errorMessages`,
        props`error.response.result.validationError`
      ),
      422: actions.getSchemaValidationErrorMessages,
      otherwise: set(props`errorMessages`, defaultErrorMessage),
    },
    showFlash(props`errorMessages`, 'error'),
  ])
}

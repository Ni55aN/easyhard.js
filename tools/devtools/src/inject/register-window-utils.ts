import { findElementByDebugId } from '../utils/dom'

/**
 * Assign functions to window context for using in inspectedWindow
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const windowGlobal = window as any

windowGlobal.findElementByDebugId = findElementByDebugId

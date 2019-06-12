
import { BEGIN_ADD_PEOPLE_SX } from './actionTypes';

/**
 * Creates a (redux) action to signal that a click/tap has been performed on
 * {@link InviteButton} and that the execution flow for adding/inviting people
 * to the current conference/meeting is to begin.
 *
 * @returns {{
 *     type: BEGIN_ADD_PEOPLE_SX
 * }}
 */
export function beginAddPeopleSx() {
    return {
        type: BEGIN_ADD_PEOPLE_SX
    };
}

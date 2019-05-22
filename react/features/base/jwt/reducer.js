// @flow

import { equals, ReducerRegistry } from '../redux';

import { SET_JWT } from './actionTypes';
import { APP_WILL_MOUNT } from '../app';
import { SET_CONFIG } from '../config';
import { getLocalJWT } from './functions';

declare var APP: Object;

/**
 * The default/initial redux state of the feature jwt.
 *
 * @private
 * @type {{
 *     isGuest: boolean
 * }}
 */
const DEFAULT_STATE = {
    /**
     * The indicator which determines whether the local participant is a guest
     * in the conference.
     *
     * @type {boolean}
     */
    isGuest: true
};


/**
 * Reduces redux actions which affect the JSON Web Token (JWT) stored in the
 * redux store.
 *
 * @param {Object} state - The current redux state.
 * @param {Object} action - The redux action to reduce.
 * @returns {Object} The next redux state which is the result of reducing the
 * specified {@code action}.
 */
ReducerRegistry.register(
    'features/base/jwt',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case SET_CONFIG:
        case APP_WILL_MOUNT: {
            return getLocalJWT() || state;
        }

        case SET_JWT: {
            // eslint-disable-next-line no-unused-vars
            const { type, ...payload } = action;
            const nextState = {
                ...DEFAULT_STATE,
                ...payload
            };

            return equals(state, nextState) ? state : nextState;
        }
        }

        return state;
    });

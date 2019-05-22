// @flow
/* global  $ */

import { equals, ReducerRegistry } from '../redux';

import { SET_JWT } from './actionTypes';
import { APP_WILL_MOUNT } from '../app';
import { SET_CONFIG } from '../config';
import { CONNECTION_ESTABLISHED } from '../connection';
import { $iq } from 'strophe.js';
import { setJWT } from './actions';
import { getLocalJWT, saveLocalJWT } from './functions';

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
 * Dummy.
 *
 * @param {Object} connection - X.
 * @param {Object} state - X.
 * @private
 * @returns {void}
 */
function _checkJWT({ connection }, state) {
    const token = getLocalJWT();

    if (token) {
        return setJWT(token.jwt);
    }

    connection.xmpp.connection.sendIQ(
        $iq({ type: 'get',
            to: connection.xmpp.connection.domain })
            .c('token', { xmlns: 'urn:xmpp:token:gen:1' }),
        res => {
            const jwtData = {
                jwt: $(res).find('>token')
                    .first()
                    .attr('token'),
                isGuest: false
            };

            saveLocalJWT(jwtData);

            APP.store.dispatch(setJWT(jwtData.jwt));
        },
        err => {
            console.error(err);
        }
    );

    return state;
}

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

        case CONNECTION_ESTABLISHED: {
            return _checkJWT(action, state);
        }
        }

        return state;
    });

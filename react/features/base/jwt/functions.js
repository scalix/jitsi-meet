/* @flow */

import { parseURLParams } from '../config';

/**
 * Retrieves the JSON Web Token (JWT), if any, defined by a specific
 * {@link URL}.
 *
 * @param {URL} url - The {@code URL} to parse and retrieve the JSON Web Token
 * (JWT), if any, from.
 * @returns {string} The JSON Web Token (JWT), if any, defined by the specified
 * {@code url}; otherwise, {@code undefined}.
 */
export function parseJWTFromURLParams(url: URL = window.location) {
    return parseURLParams(url, true, 'search').jwt;
}


/**
 * Get stored JWT token.
 *
 * @returns {Object} JWT object.
 * @private
 */
export function getLocalJWT() {
    const jwt = window.localStorage.getItem('features/base/jwt');

    if (jwt) {
        return JSON.parse(jwt);
    }

    return null;
}

/**
 * Dump jwt feature to local storage.
 *
 * @param {Object} jwtData - State jwt feature struct.
 * @returns {void}
 */
export function saveLocalJWT(jwtData: Object) {
    window.localStorage.setItem(
        'features/base/jwt',
        JSON.stringify(jwtData)
    );
}


/**
 * Dump jwt feature to local storage.
 *
 * @returns {void}
 */
export function deleteSavedJWT() {
    window.localStorage.removeItem('features/base/jwt');
}

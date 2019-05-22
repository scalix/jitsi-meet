// @flow

import { ReducerRegistry, set } from '../base/redux';
import { PersistenceRegistry } from '../base/storage';

import {
    SET_SIDEBAR_VISIBLE,
    SET_WELCOME_PAGE_LISTS_DEFAULT_PAGE
} from './actionTypes';
import { SET_JWT } from '../base/jwt';

/**
 * The name of the redux store/state property which is the root of the redux
 * state of the feature {@code welcome}.
 */
const STORE_NAME = 'features/welcome';

/**
 * Sets up the persistence of the feature {@code welcome}.
 */
PersistenceRegistry.register(STORE_NAME, {
    defaultPage: true,
    loading: true
});

/**
 * Reduces redux actions for the purposes of the feature {@code welcome}.
 */
ReducerRegistry.register(STORE_NAME, (state = {}, action) => {
    switch (action.type) {
    case SET_SIDEBAR_VISIBLE:
        return set(state, 'sideBarVisible', action.visible);

    case SET_WELCOME_PAGE_LISTS_DEFAULT_PAGE:
        return set(state, 'defaultPage', action.pageIndex);
    case SET_JWT:
    case 'DONE_JWT':
        return set(state, 'loading', false);
    }

    return state;
});

// @flow

import _ from 'lodash';
import InlineMessage from '@atlaskit/inline-message';
import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { createInviteDialogEvent, sendAnalytics } from '../../analytics';
import { Dialog, hideDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';

import { connect } from '../../base/redux';

import {
    _mapStateToProps as _abstractMapStateToProps
} from '../../invite/components/add-people-dialog/AbstractAddPeopleDialog';
import { FieldTextStateless } from '@atlaskit/field-text';

declare var interfaceConfig: Object;
declare var APP: Object;

/**
 * The type of the React {@code Component} props of {@link AddPeopleDialog}.
 */
type Props = {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,
};

export type State = {

    /**
     * Indicating that an error occurred when adding people to the call.
     */
    addToCallError: boolean,

    /**
     * Indicating that we're currently adding the new people to the
     * call.
     */
    addToCallInProgress: boolean,

    /**
     * Error message if set.
     */
    addToCallErrorMessage: string,

    /**
     * Display name of invitee.
     */
    displayName: null,


    /**
     * Email of invitee.
     */
    email: null
}

/**
 * The dialog that allows to invite people to the call.
 */
class SxAddPeopleDialog extends Component<Props, State> {

    state = {
        addToCallError: false,
        addToCallErrorMessage: '',
        addToCallInProgress: false,
        displayName: null,
        email: null
    }

    /**
     * Initializes a new {@code AddPeopleDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onSubmit = this._onSubmit.bind(this);
        this._canGenerateToken = this._canGenerateToken.bind(this);

    }

    /**
     * Sends an analytics event to record the dialog has been shown.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        sendAnalytics(createInviteDialogEvent(
            'invite.dialog.opened', 'dialog'));
    }

    /**
     * Sends an analytics event to record the dialog has been closed.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        sendAnalytics(createInviteDialogEvent(
            'invite.dialog.closed', 'dialog'));
    }

    /**
     * Renders the content of this component.
     *
     * @returns {ReactElement}
     */
    render() {

        return (
            <Dialog
                okDisabled = { this._canGenerateToken() === false }
                okKey = 'addPeople.add'
                onSubmit = { this._onSubmit }
                titleKey = 'addPeople.title'
                width = 'medium'>
                <div className = 'add-people-form-wrap'>
                    { this._renderErrorMessage() }
                    { this._renderInvitee() }
                </div>
            </Dialog>
        );
    }

    /**
     * Renders the error message if the add doesn't succeed.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderInvitee() {
        const { t } = this.props;
        const { displayName, email } = this.state;

        return (
            <div className = 'sx-invite-edit profile-edit'>
                <div className = 'sx-invite-edit-field profile-edit-field' >
                    <FieldTextStateless
                        autoFocus = { true }
                        compact = { true }
                        id = 'setDisplayName'
                        label = { t('profile.setDisplayNameLabel') }
                        // eslint-disable-next-line react/jsx-no-bind
                        onChange = {
                            ({ target: { value } }) =>
                                this.setState({ displayName: value })
                        }
                        placeholder = { t('settings.name') }
                        shouldFitContainer = { true }
                        type = 'text'
                        value = { displayName } />
                </div>
                <div className = 'sx-invite-edit-field profile-edit-field'>
                    <FieldTextStateless
                        compact = { true }
                        id = 'setEmail'
                        label = { t('profile.setEmailLabel') }
                        // eslint-disable-next-line react/jsx-no-bind
                        onChange = {
                            ({ target: { value } }) =>
                                this.setState({ email: value })
                        }
                        placeholder = { t('profile.setEmailInput') }
                        shouldFitContainer = { true }
                        type = 'text'
                        value = { email } />
                </div>
            </div>
        );
    }

    _canGenerateToken: () => void;

    /**
     * Submits the selection for inviting.
     *
     * @private
     * @returns {void}
     */
    _canGenerateToken() {
        if (!APP.connection && (APP.conference && _.isEmpty(APP.conference.roomName))) {
            return false;
        }

        const { displayName, email } = this.state;

        return !_.isEmpty(displayName) && !_.isEmpty(email);
    }

    _onSubmit: () => void;

    /**
     * Submits the selection for inviting.
     *
     * @private
     * @returns {void}
     */
    _onSubmit() {
        const { displayName, email } = this.state;

        if (!this._canGenerateToken()) {
            this.setState({
                addToCallError: true,
                addToCallErrorMessage: 'Some fields are empty or broken connection.'
            });

            return;
        }
        this.setState({ addToCallError: false });

        APP.connection.generateToken([ {
            username: displayName,
            email,
            room: APP.conference.roomName
        } ]).then(tokens => {
            console.log(tokens[0]);
            this.props.dispatch(hideDialog());
        })
            .catch(err => {
                console.log(err);
                this.setState({
                    addToCallError: true,
                    addToCallErrorMessage: 'Some fields are empty or broken connection.'
                });
            });

    }


    /**
     * Renders the error message if the add doesn't succeed.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderErrorMessage() {
        if (!this.state.addToCallError) {
            return null;
        }

        const { t } = this.props;
        const supportString = t('inlineDialogFailure.supportMsg');
        const supportLink = interfaceConfig.SUPPORT_URL;
        const supportLinkContent
            = (
                <span>
                    <span>
                        { supportString.padEnd(supportString.length + 1) }
                    </span>
                    <span>
                        <a
                            href = { supportLink }
                            rel = 'noopener noreferrer'
                            target = '_blank'>
                            { t('inlineDialogFailure.support') }
                        </a>
                    </span>
                    <span>.</span>
                </span>
            );

        return (
            <div className = 'modal-dialog-form-error'>
                <InlineMessage
                    title = { t('addPeople.failedToAdd') }
                    type = 'error'>
                    { supportLinkContent }
                </InlineMessage>
            </div>
        );
    }

}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code SxAddPeopleDialog}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     displayName: string,
 *     addToCallErrorMessage: string,
 *     email: Array<string>,
 * }}
 */
function _mapStateToProps(state) {
    return {
        displayName: null,
        email: null,
        addToCallErrorMessage: '',
        ..._abstractMapStateToProps(state)
    };
}

export default translate(connect(_mapStateToProps)(SxAddPeopleDialog));

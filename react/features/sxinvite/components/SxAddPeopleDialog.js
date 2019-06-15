// @flow

import _ from 'lodash';
import InlineMessage from '@atlaskit/inline-message';
import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { createInviteDialogEvent, sendAnalytics } from '../../analytics';
import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';

import { connect } from '../../base/redux';

import { FieldTextStateless } from '@atlaskit/field-text';
import { getInviteURL } from '../../base/connection';
import { getLocalParticipant } from '../../base/participants';

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

    /**
     * Conference password.
     */
    conferencePassword: string,

    /**
     * Conference name.
     */
    conferenceName: string,

    /**
     * Url for current conference.
     */
    inviteURL: string,

    /**
     * Local participant
     */
    _localParticipant: Object
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
    displayName: string,


    /**
     * Email of invitee.
     */
    email: string,

    /**
     * Invitee jwt token.
     */
    inviteeJWT: string,

    /**
     * Dummy state
     */
    notifications: boolean
}

/**
 * The dialog that allows to invite people to the call.
 */
class SxAddPeopleDialog extends Component<Props, State> {

    state = {
        addToCallError: false,
        addToCallErrorMessage: '',
        addToCallInProgress: false,
        displayName: '',
        email: '',
        inviteeJWT: '',
        notifications: false
    }

    _copyElement = null;

    notifications = []

    /**
     * Initializes a new {@code AddPeopleDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._copyElement = null;

        // Bind event handlers so they are only bound once per instance.
        this._onSubmit = this._onSubmit.bind(this);
        this._canGenerateToken = this._canGenerateToken.bind(this);
        this._setCopyElement = this._setCopyElement.bind(this);
        this._onCopyInviteURL = this._onCopyInviteURL.bind(this);
        this._getTextToCopy = this._getTextToCopy.bind(this);

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
        const { t } = this.props;
        const { inviteeJWT, addToCallInProgress } = this.state;

        let link = '';

        if (!_.isEmpty(inviteeJWT)) {
            link = (<div className = 'info-dialog-conference-url'>
                <span className = 'info-label'>
                    { t('info.conferenceURL') }
                </span>
                <span className = 'spacer'>&nbsp;</span>
                <span className = 'info-value'>
                    <a
                        className = 'info-dialog-url-text'
                        href = { this._getDisplayUrl() }
                        onClick = { this._onCopyInviteURL } >
                        { this._getDisplayUrl() }
                        <br />
                        {t('dialog.copy')}
                    </a>
                </span>
            </div>
            );
        }
        const notifs = this.notifications.map((notif, index, object) => {
            object.splice(index);

            return (
                <InlineMessage
                    key = { index }
                    title = { notif }
                    type = 'info' />
            );
        });

        return (
            <Dialog
                okDisabled = { addToCallInProgress === false ? this._canGenerateToken() === false : true }
                okKey = 'addPeople.add'
                onSubmit = { this._onSubmit }
                titleKey = 'addPeople.title'
                width = 'medium'>
                <div className = 'add-people-form-wrap'>
                    { notifs }
                    { link }
                    { this._renderErrorMessage() }
                    { this._renderInvitee() }
                    <textarea
                        className = 'info-dialog-copy-element'
                        readOnly = { true }
                        ref = { this._setCopyElement }
                        tabIndex = '-1'
                        value = { this._getTextToCopy() } />
                </div>
            </Dialog>
        );
    }


    /**
     * Build valid url for invitation.
     *
     * @returns {string} URL.
     * @private
     */
    _getDisplayUrl() {
        const { inviteURL } = this.props;
        const { inviteeJWT } = this.state;

        return `${inviteURL}?jwt=${inviteeJWT}`;
    }

    _getTextToCopy: () => string;

    /**
     * Creates a message describing how to dial in to the conference.
     *
     * @private
     * @returns {string}
     */
    _getTextToCopy() {
        const { _localParticipant, conferenceName, t } = this.props;

        let invite = _localParticipant && _localParticipant.name
            ? t('info.inviteURLFirstPartPersonal', { name: _localParticipant.name })
            : t('info.inviteURLFirstPartGeneral');
        const moreInfo = t('info.inviteURLMoreInfo',
            { conferenceID: conferenceName });

        invite += t('info.inviteURLSecondPart', {
            url: this._getDisplayUrl(),
            moreInfo
        });

        return invite;
    }

    _onCopyInviteURL: (Object) => void;

    /**
     * Callback invoked to copy the contents of {@code this._copyElement} to the
     * clipboard.
     *
     * @param {Event} event - Event.
     * @private
     * @returns {void}
     */
    _onCopyInviteURL(event) {
        event.preventDefault();
        try {
            if (!this._copyElement) {
                throw new Error('No element to copy from.');
            }

            this._copyElement && this._copyElement.select();
            document.execCommand('copy');
            this._copyElement && this._copyElement.blur();
            this.notifications.push('Url copied to clipboard');
            this.setState({ notifications: true });
        } catch (err) {
            console.log(err);
        }
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

    _setCopyElement: () => void;

    /**
     * Sets the internal reference to the DOM/HTML element backing the React
     * {@code Component} input.
     *
     * @param {HTMLInputElement} element - The DOM/HTML element for this
     * {@code Component}'s input.
     * @private
     * @returns {void}
     */
    _setCopyElement(element: Object) {
        this._copyElement = element;
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
        const { displayName, email, addToCallInProgress } = this.state;
        const { t } = this.props;

        if (addToCallInProgress) {
            return;
        }

        if (!this._canGenerateToken()) {
            this.setState({
                addToCallError: true,
                addToCallErrorMessage: 'Some fields are empty or broken connection.'
            });

            return;
        }
        this.setState({
            addToCallError: false,
            addToCallInProgress: true
        });

        APP.connection.generateToken([ {
            username: displayName,
            email,
            room: APP.conference.roomName
        } ]).then(tokens => {
            const { token, email: email_ } = tokens[0];

            this.notifications.push('Sending email to the user');
            this.setState({ inviteeJWT: token });

            const body = this._getTextToCopy();
            const emails = [
                {
                    to: email_,
                    subject: t('info.inviteURLFirstPartGeneral'),
                    body: [
                        {
                            type: 'text/plain',
                            text: body
                        },
                        {
                            type: 'text/html',
                            text: `<html><body>${body}</body></html>`
                        }
                    ]
                }
            ];

            APP.connection.sendEmail(emails).then(item => {
                if (item[0].sent) {
                    this.notifications.push(`Email was sent to the user ${email_}`);
                } else {
                    this.setState({
                        addToCallError: true,
                        addToCallErrorMessage: `Unable to sent email to ${email_}`
                    });
                }
            })
                .catch(err => {
                    console.log(err);
                    this.setState({
                        addToCallError: true,
                        addToCallErrorMessage: 'Some fields are empty or broken connection.'
                    });
                })
                .finally(() => {
                    this.setState({ addToCallInProgress: false });
                });
        })
            .catch(err => {
                console.log(err);
                this.setState({
                    addToCallError: true,
                    addToCallErrorMessage: 'Some fields are empty or broken connection.',
                    addToCallInProgress: false
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
        const { addToCallErrorMessage } = this.state;
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
                    secondaryText = { addToCallErrorMessage }
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
 *     inviteURL: string,
 *     conferenceName: string,
 *     conferencePassword: string
 * }}
 */
function _mapStateToProps(state) {
    const {
        password,
        room
    } = state['features/base/conference'];

    return {
        inviteURL: getInviteURL(state),
        conferenceName: room,
        conferencePassword: password,
        _localParticipant: getLocalParticipant(state)
    };
}

export default translate(connect(_mapStateToProps)(SxAddPeopleDialog));

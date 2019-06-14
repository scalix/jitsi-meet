/* global interfaceConfig, APP, config */

import React from 'react';

import { translate } from '../../base/i18n';
import { Platform, Watermarks } from '../../base/react';
import { CalendarList } from '../../calendar-sync';
import { RecentList } from '../../recent-list';
import { SettingsButton, SETTINGS_TABS } from '../../settings';
import { connect } from '../../base/redux';
import { openConnection } from '../../../../connection';
import {
    AbstractWelcomePage,
    _mapStateToProps as _abstractMapStateToProps
} from './AbstractWelcomePage';


import Tabs from './Tabs';
import { getLocalParticipant, getParticipantDisplayName } from '../../base/participants';
import { appNavigate } from '../../app';


/**
 * The Web container rendering the welcome page.
 *
 * @extends AbstractWelcomePage
 */
class WelcomePage extends AbstractWelcomePage {
    /**
     * Default values for {@code WelcomePage} component's properties.
     *
     * @static
     */
    static defaultProps = {
        _room: '',
        loading: true,
        reload: false,
        voiceOnly: false
    };

    /**
     * Initializes a new WelcomePage instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            ...this.state,

            generateRoomnames:
                interfaceConfig.GENERATE_ROOMNAMES_ON_WELCOME_PAGE,
            selectedTab: 0,
            loading: true,
            voiceOnly: false
        };


        /**
         * The HTML Element used as the container for additional content. Used
         * for directly appending the additional content template to the dom.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalContentRef = null;

        /**
         * The template to use as the main content for the welcome page. If
         * not found then only the welcome page head will display.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalContentTemplate = document.getElementById(
            'welcome-page-additional-content-template');

        // Bind event handlers so they are only bound once per instance.
        this._onFormSubmit = this._onFormSubmit.bind(this);
        this._onRoomChange = this._onRoomChange.bind(this);
        this._setAdditionalContentRef = this._setAdditionalContentRef.bind(this);
        this._onTabSelected = this._onTabSelected.bind(this);
        this._onVoiceOnlyChanged = this._onVoiceOnlyChanged.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        document.body.classList.add('welcome-page');
        this._initConnection();
    }

    /**
     * Initialize connection.
     *
     * @returns {void}
     * @private
     */
    _initConnection() {
        openConnection({
            retry: true
        }).then(con => {
            APP.connection = con;
            this.setState({ reload: false });
        })
            .catch(err => {
                console.error(err);
                APP.UI.notifyInternalError(err);
                if (APP.connection) {
                    APP.connection.diconnect();
                }
            });
    }

    /**
     * Removes the classname used for custom styling of the welcome page.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        super.componentWillUnmount();

        document.body.classList.remove('welcome-page');

        if (APP.connection) {
            APP.connection.disconnect();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    render() {

        const { t, _displayName, reload } = this.props;
        let { loading } = this.props;
        const showAdditionalContent = this._shouldShowAdditionalContent();
        const { APP_NAME } = interfaceConfig;

        if (reload) {
            this._onReset();
            loading = true;
        }

        if (loading || !APP.connection) {
            return (
                <img
                    height = '100%'
                    src = './images/index.futuristic-game-interface-preloader.svg'
                    width = '100%' />
            );
        } else if (!this.state.updateTimeoutId) {
            if (this.state.generateRoomnames) {
                this._updateRoomname();
            }

            if (this._shouldShowAdditionalContent()) {
                this._additionalContentRef.appendChild(
                    this._additionalContentTemplate.content.cloneNode(true));
            }
        }

        return (
            <div
                className = { `welcome ${showAdditionalContent
                    ? 'with-content' : 'without-content'}` }
                id = 'welcome_page'>
                <div className = 'welcome-watermark'>
                    <Watermarks />
                </div>
                <div className = 'header'>
                    <div className = 'welcome-page-settings'>
                        <SettingsButton
                            defaultTab = { SETTINGS_TABS.CALENDAR } />
                        <a
                            className = 'logout'
                            onClick = { this._onReset } >Logout</a>
                    </div>
                    <div className = 'header-image' />
                    <div className = 'header-text'>
                        <h3 className = 'header-text-title'>
                            Welcome, {_displayName}.
                        </h3>
                        <p className = 'header-text-description'>
                            {APP_NAME} - { t('welcomepage.title') }
                        </p>
                    </div>
                    <div id = 'enter_room'>
                        <div className = 'enter-room-input-container'>
                            <div className = 'enter-room-title'>
                                { t('welcomepage.enterRoomTitle') }
                            </div>
                            <form onSubmit = { this._onFormSubmit }>
                                <input
                                    autoFocus = { true }
                                    className = 'enter-room-input'
                                    id = 'enter_room_field'
                                    onChange = { this._onRoomChange }
                                    placeholder
                                        = { this.state.roomPlaceholder }
                                    type = 'text'
                                    value = { this.state.room } />
                            </form>
                            <div id = 'room_config'>
                                <label
                                    onClick = { this._onVoiceOnlyChanged } >
                                    <input
                                        checked = { this.state.voiceOnly }
                                        id = 'voice_only'
                                        name = 'voice_only'
                                        onChange = { this._onVoiceOnlyChanged }
                                        type = 'checkbox' />
                                        Voice Only
                                </label>
                            </div>
                        </div>
                        <div
                            className = 'welcome-page-button'
                            id = 'enter_room_button'
                            onClick = { this._onFormSubmit }>
                            { t('welcomepage.go') }
                        </div>
                    </div>
                    { this._renderTabs() }
                </div>
                { showAdditionalContent
                    ? <div
                        className = 'welcome-page-content'
                        ref = { this._setAdditionalContentRef } />
                    : null }
            </div>
        );
    }

    /**
     * Clear local storage.
     *
     * @param {Event} event - The HTML Event which details the form submission.
     * @private
     * @returns {void}
     */
    _onReset(event) {
        if (event) {
            event.preventDefault();
        }
        window.localStorage.clear();
        window.location.reload();
    }

    /**
     * Controls new conference to be voice only or not.
     *
     * @param {Event} e - The HTML Event which details the form submission.
     * @private
     * @returns {void}
     */
    _onVoiceOnlyChanged(e) {

        const checkbox = e.target.querySelector('#voice_only') || e.target;

        this.setState({
            voiceOnly: checkbox.checked
        });
    }

    /**
     * Prevents submission of the form and delegates join logic.
     *
     * @param {Event} event - The HTML Event which details the form submission.
     * @private
     * @returns {void}
     */
    _onFormSubmit(event) {
        event.preventDefault();

        config.startAudioOnly = true;

        let room = this.state.room || this.state.generatedRoomname;

        if (this.state.voiceOnly) {
            room = `${room}#config.startAudioOnly=true`;
        }

        if (room) {
            this.setState({ joining: true });

            // By the time the Promise of appNavigate settles, this component
            // may have already been unmounted.
            const onAppNavigateSettled
                = () => this._mounted && this.setState({ joining: false });

            this.props.dispatch(appNavigate(room))
                .then(onAppNavigateSettled, onAppNavigateSettled);
        }
    }

    /**
     * Overrides the super to account for the differences in the argument types
     * provided by HTML and React Native text inputs.
     *
     * @inheritdoc
     * @override
     * @param {Event} event - The (HTML) Event which details the change such as
     * the EventTarget.
     * @protected
     */
    _onRoomChange(event) {
        super._onRoomChange(event.target.value);
    }

    /**
     * Callback invoked when the desired tab to display should be changed.
     *
     * @param {number} tabIndex - The index of the tab within the array of
     * displayed tabs.
     * @private
     * @returns {void}
     */
    _onTabSelected(tabIndex) {
        this.setState({ selectedTab: tabIndex });
    }

    /**
     * Renders tabs to show previous meetings and upcoming calendar events. The
     * tabs are purposefully hidden on mobile browsers.
     *
     * @returns {ReactElement|null}
     */
    _renderTabs() {
        const isMobileBrowser
            = Platform.OS === 'android' || Platform.OS === 'ios';

        if (isMobileBrowser) {
            return null;
        }

        const { _calendarEnabled, t } = this.props;

        const tabs = [];

        if (_calendarEnabled) {
            tabs.push({
                label: t('welcomepage.calendar'),
                content: <CalendarList />
            });
        }

        tabs.push({
            label: t('welcomepage.recentList'),
            content: <RecentList />
        });

        return (
            <Tabs
                onSelect = { this._onTabSelected }
                selected = { this.state.selectedTab }
                tabs = { tabs } />);
    }

    /**
     * Sets the internal reference to the HTMLDivElement used to hold the
     * welcome page content.
     *
     * @param {HTMLDivElement} el - The HTMLElement for the div that is the root
     * of the welcome page content.
     * @private
     * @returns {void}
     */
    _setAdditionalContentRef(el) {
        this._additionalContentRef = el;
    }

    /**
     * Returns whether or not additional content should be displayed below
     * the welcome page's header for entering a room name.
     *
     * @private
     * @returns {boolean}
     */
    _shouldShowAdditionalContent() {
        return interfaceConfig.DISPLAY_WELCOME_PAGE_CONTENT
            && this._additionalContentTemplate
            && this._additionalContentTemplate.content
            && this._additionalContentTemplate.innerHTML.trim();
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {{
 *     _headerStyles: Object
 * }}
 */
function _mapStateToProps(state) {
    const localParticipant = getLocalParticipant(state);

    return {
        ..._abstractMapStateToProps(state),
        _displayName: getParticipantDisplayName(state, localParticipant.id),
        loading: state['features/welcome'].loading,
        reload: state['features/welcome'].reload
    };
}

export default translate(connect(_mapStateToProps)(WelcomePage));

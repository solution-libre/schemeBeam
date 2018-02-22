import React from 'react';
import axios from 'axios';
import * as settings from '../config/settingsconfig.js';
import { Sharebox } from './verify.jsx';

class Stats extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hashCode : this.props.routeParams.hashCode,
            rank : 0,
            referrals : 0
        };
    }

    componentWillMount() {
        axios.get('api/v1/getrank/' + this.state.hashCode)
        .then((response) => {
            this.setState({
                rank : response.data[0].row_number,
                referrals : response.data[0].referrals
            });
        });
    }

    prizeRange() {
        if( this.state.rank <= settings.prizeRange){
            return (
                 <div className="secondaryHeader">{__('Congratulations, you\'re in the top')} {settings.prizeRange}, {__('with a total of')} <b>{this.state.referrals} {__('referrals!')}</b> {__('Other participants can still push you out of your spot, so the more referrals you can get the better!')}</div>
            )
        } else {
            return (
            <div className="secondaryHeader">{__('Sorry, with')} {this.state.referrals}, {__('you\'re not in the top')} {settings.prizeRange} {__('contestants. Get more referrals to improve your ranking!')}</div>
            )
        }
    };

    render() {
        var referralLink = window.location.hostname + "/#/" + this.state.hashCode;
        var referralLink = referralLink.toString();
        var referralLinkEncoded = encodeURIComponent(referralLink);
        return(
            <div className="headerBox">
                <div className="headerTitle">{__('Your rank is')} #{this.state.rank}</div>
                {this.prizeRange()}
                <Sharebox hashCode={this.state.hashCode} />
            </div>
        )
    }
}

export default Stats;

import React from 'react'
import axios from 'axios'
import Authentication from '../../util/Authentication/Authentication'
import Draggable from 'react-draggable'
import ReactPlayer from 'react-player'


import './App.scss'

export default class App extends React.Component{
    constructor(props){
        super(props)
        this.Authentication = new Authentication()

        //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
        this.twitch = window.Twitch ? window.Twitch.ext : null
        this.state={
            finishedLoading:false,
            video: '',
            theme:'light',
            muted:true,
            muteButton:false,
            showing:false,
            playing:true,
            isVisible:true,
            volume: 1
        }
        this.muteControl = this.muteControl.bind(this)
        this.getTestVideo = this.getTestVideo.bind(this)
    }

    contextUpdate(context, delta){
        if(delta.includes('theme')){
            this.setState({theme:context.theme})
        }
        if(delta.includes('isPaused')){
            this.setState({showing:!context.isPaused})
            this.setState({playing:!context.isPaused})
        }
        if(delta.includes('volume')){
            this.setState({volume:context.volume})
        }
        if(delta.includes('isMuted')){
            this.setState({muted:context.isMuted})
        }
    }

    visibilityChanged(isVisible){
        this.setState({isVisible})
    }

    setVideo(target, contentType, body) {
        if (body) {
            this.setState({video: link})
        }
    }

    componentDidMount(){
        if(this.twitch){
            this.twitch.onAuthorized((auth)=>{
                this.Authentication.setToken(auth.token, auth.userId)
                if(!this.state.finishedLoading){
                    // if the component hasn't finished loading (as in we've not set up after getting a token), let's set it up now.

                    // now we've done the setup for the component, let's set the state to true to force a rerender with the correct data.
                    this.setState({finishedLoading:true})
                }
            })

            this.twitch.listen('broadcast', this.setVideo)

            this.twitch.onVisibilityChanged((isVisible,_c)=>{
                this.visibilityChanged(isVisible)
            })

            this.twitch.onContext((context,delta)=>{
                this.contextUpdate(context,delta)
            })
        }
    }

    componentWillUnmount(){
        if(this.twitch){
            this.twitch.unlisten('broadcast', this.setVideo)
        }
    }
    muteControl(){
        this.setState({muted:!this.state.muted})
    }

    getTestVideo() {
        return axios.get(`https://donatepay.ru/twitch/testvideo?token=${this.Authentication.state.token}`)
            .then(response => {
                return response.data
            })
            .then((result) => {
                this.setState({video:result})
            })
    }

    render(){
        if (this.state.finishedLoading && this.state.isVisible) {
            let link = this.state.video
            return (
                <div className="App">
                    <Draggable bounds='parent' handle='.playerWrapper'>
                        <div
                            className='playerWrapper'
                            onMouseOver={() => this.setState({ muteButton: true })}
                            onMouseOut={() => this.setState({ muteButton: false })}>
                            <div
                                className={this.state.muted ? 'buttonMute buttonMuteIcon' : 'buttonMute buttonUnmuteIcon'}
                                onClick={this.muteControl}
                                style={{ display: (this.state.muteButton && this.state.showing ? 'block' : 'none') }}/>
                            <div className='testButton' onClick={this.getTestVideo} style={{ display: (this.state.showing ? 'none' : 'block') }}>Press for test play</div>
                            <ReactPlayer style={{ display: (this.state.showing ? 'block' : 'none') }}
                                volume={this.state.volume/2}
                                url={link}
                                muted={this.state.muted}
                                playing={this.state.playing}
                                width='100%'
                                height='unset'
                                onReady={() => this.setState({ showing: true })}
                                onEnded={() => this.setState({ showing: false })}
                            />
                        </div>
                    </Draggable>
                </div>
            )
        } else {
            return (
                <div className="App">
                </div>
            )
        }
    }
}

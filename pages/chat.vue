<template>
  <div class="c-wrap">
    <div class="c-chat">
      <div class="c-video">
        <div class="c-video-block">
          <video ref="localVideo" v-if="userStream" v-bind:class="{ active: userStream }"
                 v-on:loadedmetadata="play('localVideo')"></video>
          <div class="c-video-block-control">
            <v-btn color="primary" @click="localVideo('camera')">{{ userStreamCamera ? 'Stop' : 'Show Camera' }}</v-btn>
            <v-btn color="primary" @click="localVideo('screen')">{{ userStreamScreen ? 'Stop' : 'Show Screen' }}</v-btn>

          </div>
        </div>
        <div class="c-video-block">
          <video ref="remoteVideo" v-if="remoteStream" v-bind:class="{ active: remoteStream }"
                 v-on:loadedmetadata="play('remoteVideo')"></video>
          <div class="c-video-block-control">
            <v-btn color="primary" @click="fullscreen('remote')" v-if="remoteStream">Fullscreen</v-btn>
          </div>
        </div>

      </div>
      <div class="c-chat-wrap" ref="block">
        <Message
          v-for="m in messages" :key="m.text"
          :name="m.user"
          :text="m.text"
          :time="m.time"
          :owner="m.user === user.name"
        />
      </div>
    </div>
    <div class="c-form">
      <ChatForm/>
    </div>
  </div>

</template>
<script>
import {mapState} from 'vuex'
import {mapMutations} from "vuex"
import Message from "@/components/Message";
import ChatForm from "@/components/ChatForm";

export default {
  ssr: false,
  middleware: ['chat'],
  data: () => ({
    peers: {},
    stream: '',
    userStream: false,
    userStreamCamera: false,
    userStreamScreen: false,
    remoteStream: true,
    remoteStreamMedia: '',
  }),
  sockets: {
    disconnectUser: function () {
      this.remoteClose()

    },
    userConnected: function (userId) {
      console.log('user connected', this.$peer)
      if (this.userStream) {
        const call = this.$peer.call(userId, this.stream)
        this.peers[this.user.peer] = call
      }
    }
  },
  mounted() {
    console.log(this.$peer)
      this.$peer.on('call', async call => {
        console.log(this.peers)
        this.remoteStream = true

        call.answer()

        call.on('stream', userVideoStream => {

          this.addVideoStream(this.$refs.remoteVideo, userVideoStream)
          this.remoteStreamMedia = userVideoStream
        })
        call.on('close', () => {
          this.remoteClose()
        })
        this.sockets.subscribe('stopRemoteVideoShow', function () {
          call.close()
        })

      })
      this.remoteStream = false
      this.$socket.emit('userConnectToRoom', this.user)
  },
  head() {
    return {
      title: `Room ${this.user.room}`
    }
  },
  components: {
    Message,
    ChatForm,
  },
  computed: mapState(['user', 'messages', 'users']),
  watch: {
    messages() {
      setTimeout(() => {
        this.$refs.block.scrollTop = this.$refs.block.scrollHeight
      }, 0)
    },
  },
  methods: {
    addVideoStream(video, stream) {
      video.srcObject = stream
    },
    play(name) {
      if(this.$refs[name]){
        this.$refs[name].play()
      }
    },
    async remoteClose() {
      this.remoteStream = false
      this.remoteStreamMedia.getTracks().forEach(await function (track) {
        track.stop();
      });
      this.$peer._connections.clear()
    },
    localVideo(mode) {
      if (this.userStream) {
        this.stopVideo()
        if (mode === 'screen') {
          if (this.userStreamScreen === false) {
            this.userStreamScreen = true
            this.userStreamCamera = false
            this.showVideo(mode)
          } else {
            this.userStreamScreen = false
            this.userStream = false
          }
        }
        if (mode === 'camera') {
          if (this.userStreamCamera === false) {
            this.userStreamCamera = true
            this.userStreamScreen = false
            this.showVideo(mode)
          } else {
            this.userStreamCamera = false
            this.userStream = false
          }
        }
      } else {
        if (mode === 'screen') {
          this.userStreamScreen = true
        } else {
          this.userStreamCamera = true
        }
        this.userStream = true
        this.showVideo(mode)
      }
    },
    showVideo(mode) {
      if (mode === 'screen') {
        navigator.mediaDevices.getDisplayMedia({
          video: {
            width: {ideal: 1920},
            height: {ideal: 1080}
          },
          audio: false
        }).then(stream => {
          this.$refs.localVideo.muted = true
          this.stream = stream
          this.addVideoStream(this.$refs.localVideo, stream)
          this.$socket.emit('userShowVideo', this.user)
          const user = this.users.filter(user => user.peer != this.$peer.id)
          if (user[0]) {
            const call = this.$peer.call(user[0].peer, this.stream)
            this.peers[this.user.peer] = call
          }
        })
      } else {
        navigator.mediaDevices.getUserMedia({
          video: {
            width: {min: 1024, ideal: 1280, max: 1920},
            height: {min: 776, ideal: 720, max: 1080}
          },
          audio: false
        }).then(stream => {
          this.$refs.localVideo.muted = true
          this.stream = stream
          this.addVideoStream(this.$refs.localVideo, stream)
          this.$socket.emit('userShowVideo', this.user)
          const user = this.users.filter(user => user.peer != this.$peer.id)
          if (user[0]) {
            const call = this.$peer.call(user[0].peer, this.stream)
            this.peers[this.user.peer] = call
          }
        })
      }

    },
    fullscreen(mode) {
      if (mode === 'remote') {
        const video = this.$refs.remoteVideo
        if (video.requestFullScreen) {
          video.requestFullScreen();
        } else if (video.webkitRequestFullScreen) {
          video.webkitRequestFullScreen();
        } else if (video.mozRequestFullScreen) {
          video.mozRequestFullScreen();
        }
      }
    },
    stopVideo() {
      this.$socket.emit('userStopShowVideo', this.user)
      this.stream.getTracks().forEach(function (track) {
        track.stop();
      });
    },
  }
}
</script>

<style scoped>
.c-wrap {
  height: 100%;
  position: relative;
  overflow: hidden;
}

.c-form {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  height: 80px;
  background-color: #212121;
}

.c-chat {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 80px;
  padding: 1rem;

}

.c-chat-wrap {
  overflow-y: auto;
  height: calc(100% - 320px);
}

.c-video {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  margin-bottom: 20px;
}

.c-video-block {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  width: 49%;
  height: 300px;
  background-color: #fcfcfc;
  border-radius: 5px;
}

.c-video-block video {
  opacity: 0;
  width: 100%;
  height: 257px;
}

.c-video-block video.active {
  opacity: 1;
}


</style>

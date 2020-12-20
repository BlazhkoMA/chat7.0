

<template>
    <div class="c-wrap">
      <div class="c-chat">
        <div class="c-video" ref="videoGrid">
        </div>
        <div class="c-chat-wrap"  ref="block">
          <Message
            v-for="m in messages" :key="m.text"
            :name="m.name"
            :text="m.text"
            :owner="m.id === user.id"
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
  date: () => ({
    peers: {},
    stream: '',
  }),
  sockets: {
    newUserConnected: function (userId) {
      this.connectToNewUser(userId, this.stream)
    }
  },
  mounted() {
    const myVideo = document.createElement('video')
    myVideo.muted = true
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then(stream => {
      this.stream = stream
      this.addVideoStream(myVideo, stream)

      this.$peer.on('call', call => {
        console.log('call')
        call.answer(this.stream)
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
          this.addVideoStream(video, userVideoStream)
        })
      })
      this.$socket.emit('newConnection', this.$peer.id, this.user.room)
    })
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
  computed: mapState(['user', 'messages']),
  watch: {
    messages() {
      setTimeout( () =>  {
        this.$refs.block.scrollTop = this.$refs.block.scrollHeight
      }, 0)
    },
  },
  methods: {
    addVideoStream(video, stream) {
      video.srcObject = stream
      video.addEventListener('loadedmetadata', () => {
        video.play()
      })
      this.$refs.videoGrid.append(video)
    },
    connectToNewUser(userId, stream) {
      const call = this.$peer.call(userId, stream)
      const video = document.createElement('video')
      call.on('stream', userVideoStream => {
        this.addVideoStream(video, userVideoStream)
      })
      call.on('close', () => {
        video.remove()
      })
    }
  }
}
</script>

<style scoped>
.c-wrap{
  height: 100%;
  position: relative;
  overflow: hidden;
}
.c-form{
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  height: 80px;
  background-color: #212121;
}

.c-chat{
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 80px;
  padding: 1rem;

}
.c-chat-wrap{
  overflow-y: auto;
  height: calc(100% - 320px);
}
.c-video{
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  margin-bottom: 20px;
}
.c-video-local{
  width: 49%;
  height: 300px;
  background-color: grey;
}
.c-video-remote{
  width: 49%;
  height: 300px;
  background-color: grey;
}

</style>

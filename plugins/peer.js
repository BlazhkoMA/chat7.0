import Vue from 'vue'
import VuePeerJS from 'vue-peerjs';
import Peer from 'peerjs';
export default function() {
  Vue.use(VuePeerJS, new Peer())

}

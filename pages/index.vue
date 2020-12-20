<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8>
      <v-card min-width="400">
        <v-snackbar
          v-model="snackbar"
          :timeout="6000"
        >
          {{ message }}

          <template v-slot:action="{ attrs }">
            <v-btn
              color="blue"
              text
              v-bind="attrs"
              @click="snackbar = false"
            >
              Close
            </v-btn>
          </template>
        </v-snackbar>
        <v-card-title>Nuxt Express Socket IO Chat</v-card-title>
        <v-card-text>
        <v-form
          ref="form"
          v-model="valid"
          lazy-validation
        >
          <v-text-field
            v-model="name"
            :counter="16"
            :rules="nameRules"
            label="Your Name"
            required
          ></v-text-field>

          <v-text-field
            v-model="room"
            :rules="roomRules"
            label="Room Number"
            required
          ></v-text-field>

          <v-btn
            :disabled="!valid"
            color="primary"
            class="mr-4"
            @click="submit"
          >
            Enter
          </v-btn>
        </v-form>
        </v-card-text>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
import {mapMutations} from "vuex"
export default {
  layout: 'empty',
  head: {
    title: 'Nuxt Express Socket IO Chat'
  },
  mounted() {
    const {message} = this.$route.query
    if(message === 'noUser'){
      this.message = 'Entry data'
    } else if(message === 'leftChat'){
      this.message = 'You left chat'
    }

    this.snackbar = !!this.message
  },
  data: () => ({
    valid: true,
    snackbar: false,
    name: '',
    message: '',
    nameRules: [
      v => !!v || 'Name is required',
      v => (v && v.length <= 16) || 'Name must be less than 16 characters',
    ],
    room: '',
    roomRules: [
      v => !!v || 'Room not found',
    ],
  }),
  methods: {
    ...mapMutations(['setUser']),
    submit () {
      if(this.$refs.form.validate()){
        const user = {
          name: this.name,
          room: this.room
        };
        this.$socket.emit('userJoined', user, data => {
            if( typeof data === 'string'){
            } else {
              user.id = data.userId
              this.setUser(user)
              this.$router.push('/chat')
            }
        });
      }
    },
  },
}
</script>

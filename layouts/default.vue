<template>
  <v-app app>
    <v-navigation-drawer app v-model="drawer">

      <v-list >

        <v-subheader>Users in room</v-subheader>
        <v-list-item-group>
          <v-list-item
            v-for="u in users"
            :key="u.id"
          >
            <v-list-item-content>
              <v-list-item-title>{{u.name}}</v-list-item-title>
            </v-list-item-content>

            <v-list-item-icon>
              <v-icon :color="u.id === user.id ? 'deep-purple accent-4' : 'grey'">
                mdi-message-outline
              </v-icon>
            </v-list-item-icon>
          </v-list-item>
        </v-list-item-group>
      </v-list>

    </v-navigation-drawer>
    <v-app-bar app>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-spacer></v-spacer>
      <v-toolbar-title>Чат комнаты {{user.room}}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="exit">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>
    <v-main>
      <div style="height: 100%">
        <nuxt/>
      </div>
    </v-main>
  </v-app>
</template>

<script>

import {mapState, mapMutations} from "vuex"
export default {
  data: () => ({
    drawer: true,
  }),
  computed: mapState(['user', 'users']),
  mounted() {
    this.$vuetify.theme.dark = true

  },
  methods: {
    ...mapMutations(['clearData']),
    exit() {
      this.$socket.emit('userLeft', this.user.id, () => {
        this.$router.push('/?message=leftChat')
        this.clearData()
      })
    }
  },
};
</script>

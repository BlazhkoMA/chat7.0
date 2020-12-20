<template>
  <v-app app>
    <v-main>
      <v-container fluid>
        <nuxt/>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
export default {
  mounted() {
    this.$vuetify.theme.dark = true
  },
}
</script>

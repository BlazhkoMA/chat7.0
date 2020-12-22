export const state = () => ({
  user: {},
  messages: [],
  users: []
})

export const mutations = {
  setUser(state, user) {
    state.user = user
  },
  clearData(state){
    state.user = {}
    state.messages = []
    state.users = []
  },
  SOCKET_newMessage(state, message) {
    state.messages.push(message)
  },
  SOCKET_initMessages(state, messages) {
    state.messages = messages
  },
  SOCKET_updateUsers(state, users) {
    state.users = users
  },
}

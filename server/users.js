class Users {
  constructor() {
    this.users = []
  }

  add(user){
    this.users.push(user)
  }

  get(id){
    return this.users.find(user => user.id === id)
  }

  remove(id) {
    const user = this.get(id)

    if(user){
      this.users = this.users.filter(user => user.id !== id)
    }
    return user
  }
  checkInside(name, id){
    return this.users.find(user => user.name == name && user.room == id)
  }
  getByRoom(room){
    return this.users.filter(user => user.room === room)
  }
}

module.exports = function () {
  return new Users()
}

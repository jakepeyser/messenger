/* eslint-disable no-new */

new Vue({
  el: '#app',
  data: {
    greeting: 'Welcome to Messenger 🔥',
    message: '',
    pin: '',
    messageError: false,
    pinError: false,
    sending: false,
    inProgress: false,
    messagesSent: 0,
    done: false,
    results: []
  },

  mounted() {
    axios.get('/api/heartbeat')
      .then(() => {
        console.log('server is running..')
        return axios.get('/api/messages')
      })
      .then(result => {
        this.results = result.data
      })
  },

  methods: {
    formatDate(date, small) {
      return moment(date).format(small ? 'MMM Do' : 'lll')
    },

    reset() {
      this.message = ''
      this.pin = ''
      this.messagesSent = 0
      this.done = false
      this.inProgress = false
    },

    sendMessage() {
      if (!this.message) {
        this.messageError = true
      } else { 
        this.sending = true
        axios.post('/api/messages', {
          text: this.message,
          pin: this.pin
        })
        .then(response => {
          console.log(response)
          const responses = response.data.responses
          if (responses && responses.length > 0) {
            this.results = [...responses, ...this.results]
          }
          this.messagesSent += response.data.numSent
          this.done = response.data.done
          this.inProgress = true
          this.pinError = false
        })
        .catch(error => {
          console.log(error)
          if (error.response.status === 401) {
            this.pinError = true
          }
        })
        .then(() => {
          this.sending = false
          this.messageError = false
        })
      }
    }
  }
})

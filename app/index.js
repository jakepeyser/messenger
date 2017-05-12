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
    results: [],
    curPage: 1,
    resultsPerPage: 10,
    pages: 0
  },

  computed: {
    prevPageDisabled() {
      return this.curPage === 1
    },

    nextPageDisabled() {
      return this.curPage === this.pages
    }
  },

  mounted() {
    axios.get('/api/heartbeat')
      .then(() => {
        console.log('server is running..')
        this.getMessages()
      })
  },

  methods: {
    changePage(page) {
      if (this.curPage !== page) {
        this.getMessages(page)
      }
    },

    getMessages(newPage = 1) {
      axios.get(`/api/messages?page=${newPage}&per${this.resultsPerPage}`)
        .then(result => {
          this.curPage = newPage
          this.results = result.data.messages
          this.pages = result.data.totalPages
        })
    },

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

    rotatePage(allow, next) {
      if (allow) {
        const newPage = this.curPage + (next ? 1 : -1)
        this.getMessages(newPage)
      }
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
          this.messagesSent += response.data.numSent
          this.done = response.data.done
          this.inProgress = true
          this.pinError = false
          this.getMessages()
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

import {createStore} from 'vuex'

export default createStore({
  state: {
    pictures: [],
    total: 0,
    current: 0,
    loading: false,
    scroll: false
  },
  mutations: {
    ADD_PICTURE(state, picture) {
      state.pictures.push(picture)
    },
    SHOW_LOADER(state) {
      state.loading = true
    },
    HIDE_LOADER(state) {
      state.loading = false
    },
    SET_COUNTER(state, total) {
      state.total = total
      state.current = 0
    },
    INCREMENT_COUNTER(state) {
      state.current++
    },
    CLEAR_PICTURES(state) {
      state.pictures = []
    },
    SET_SCROLL(state, checked){
      state.scroll=checked
    }
  },
  getters: {
    pictures: state => state.pictures,
    loading: state => state.loading,
    counter(state) {
      return {
        total: state.total,
        current: state.current
      } 
    },
    scroll: state => state.scroll
  }
})
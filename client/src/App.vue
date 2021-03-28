<template>
  <div id="app">
    <ControlPanel
      @start-parsing="startParsing"
    />
    <PictureBox />
  </div>
</template>

<script>
import axios from 'axios'
import ControlPanel from '@/components/ControlPanel'
import PictureBox from '@/components/PictureBox'
import { API_URL } from './config'

export default {
  name: 'App',
  components: {
    PictureBox,
    ControlPanel
  },
  methods: {
    async startParsing(number) {
      this.$store.commit('SET_COUNTER', number)
      this.$store.commit('CLEAR_PICTURES')
      this.$store.commit('SHOW_LOADER')
      for (let i = 0; i < number; i++) {
        const { data } = await axios.get(`${API_URL}/rimg`)
        this.$store.commit('ADD_PICTURE', data)
        this.$store.commit('INCREMENT_COUNTER')
        setTimeout(() => this.scrollBottom(), 100)
      }
      setTimeout(() => this.scrollTop(), 100)
      this.$store.commit('HIDE_LOADER')
    },
    scrollBottom() {
      const el = document.getElementById('scroll-bottom')
      el.scrollIntoView({ behavior: 'smooth' })
    },
    scrollTop() {
      const el = document.getElementById('scroll-top')
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }
}
</script>

<style>
html,
body {
  width: 100%;
  height: fit-content;
  margin: 0;
  padding: 0;
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande',
    'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
  color: white;

}

html {
  background: linear-gradient(
      135deg,
      rgba(11, 111, 244, 1) 0%,
      rgba(146, 72, 238, 1) 100%
    )
    no-repeat center center / 100% 100%;
}
html{
   background: linear-gradient(
      135deg,
      rgba(11, 111, 244, 1) 0%,
      rgba(146, 72, 238, 1) 100%
    )
    no-repeat center center / 100% 100%;
}
</style>

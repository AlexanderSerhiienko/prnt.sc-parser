<template>
  <div class="wrapper">
    <div class="github">
      <a href="https://github.com/AlexanderSerhiienko/prnt.sc-parser" target="_blank">GitHub</a>
    </div>
    <div id="scroll-top"></div>
    <div class="logo">
      <h1>Prnt.sc <span class="parser">Parser</span> </h1>
    </div>
    <h3>Enter the amount of photos</h3>
    <div class="controls">
      <input type="number" v-model="text" @keypress.enter="onSubmit" />
      <button :disabled="loading" @click="onSubmit">Find</button>
    </div>
    <div v-if="loading" class="indicator">
      <Loading />
    </div>
  </div>
</template>
<script>
import Loading from './Loading.vue'

export default {
  data() {
    return {
      text: ''
    }
  },
  components: {
    Loading
  },
  props: ['pictures', 'loading'],
  methods: {
    onSubmit() {
      if (this.loading) return
      this.$emit('start-parsing', parseInt(this.text))
      this.text = ''
    }
  }
}
</script>
<style scoped>
.indicator {
  position: fixed;
  bottom: 10px;
  right: 10px;
  height: 50px;
  width: 50px;
  background: white;
  border-radius: 22px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding-top: 20px;
}

.logo {
  background: linear-gradient(
    135deg,
    rgba(166, 238, 72, 0.3) 0%,
    rgba(11, 111, 244, 0.3) 100%
  );
  border-radius: 18px;
  padding: 15px;
  width: fit-content;
  box-shadow: 3px 3px 8px 0px rgba(0, 0, 0, 0.3);
  color: white;
}

.logo h1 {
  margin: 0;
}
.parser {
  color: greenyellow;
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
}
.controls input {
  border-radius: 18px;
  border: none;
  outline: none;
  font-size: 16px;
  padding: 0px 10px;
  width: 50px;
  height: 30px;
}
.controls button {
  border-radius: 18px;
  border: none;
  outline: none;
  margin-left: 10px;
  padding: 9px;
  cursor: pointer;
  background: linear-gradient(
    135deg,
    rgba(73, 72, 238, 1) 0%,
    rgba(114, 11, 244, 1) 100%
  );
  color: white;
  text-transform: uppercase;
  transition: 0.2s;
}
.controls button:hover {
  opacity: 0.6;
}
.controls button:disabled {
  opacity: 0.4;
}
.github{
  position: absolute;
    top: 40px;
    right: 20px;
    border-radius: 18px;
     background: linear-gradient(135deg, rgba(255, 0, 0, 0.3) 0%, rgb(11, 112, 244) 100% );
    box-shadow: 3px 3px 8px 0px rgb(0 0 0 / 30%);
}
.github a{
    padding:30px;
    font-size:150%;
    color:greenyellow;
    text-decoration: none;
}
</style>

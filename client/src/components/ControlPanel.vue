<template>
  <div class="wrapper">
    <div class="github">
      <a
        href="https://github.com/AlexanderSerhiienko/prnt.sc-parser"
        target="_blank"
      >
        <font-awesome-icon class="github-icon" :icon="['fab', 'github']" />
      </a>
    </div>
    <div id="scroll-top"></div>
    <div class="logo">
      <h1>Prnt.sc <span class="parser">Parser</span></h1>
    </div>
    <h3>Enter the amount of photos</h3>
    <div class="controls">
      <input
        type="number"
        v-model="text"
        @keypress.enter="onSubmit"
        @change="checkInput"
        min="0"
      />
      <button :disabled="loading" @click="onSubmit">
        <div class="button-background">
          <font-awesome-icon class="searchIcon" icon="search" />
        </div>
      </button>
    </div>
    <transition
      enter-active-class="animate__animated animate__fadeInRight"
      leave-active-class="animate__animated animate__fadeOutRight"
    >
      <div v-if="loading" class="ui-wrapper">
        <div class="counter">
          <span class="checkbox">
            <!-- <span class="checkbox-hint">Auto-Scroll</span> -->
            <input type="checkbox" :checked="scrollState" @change="checkboxState($event)" >
            </span>
          <span>{{ counter.current }}/{{ counter.total }}</span>
            
          
        </div>
        <div class="indicator">
          <Loading />
        </div>
      </div>
    </transition>
  </div>
</template>
<script>
import Loading from './Loading.vue'

export default {
  data() {
    return {
      maxl: 5,
      text: '',
      validation: true
    }
  },
  components: {
    Loading
  },
  methods: {
    onSubmit() {
      if (this.loading) return
      this.$emit('start-parsing', parseInt(this.text))
      this.text = ''
    },
    checkboxState(event){
      this.$store.commit('SET_SCROLL', event.target.checked)
    }
  },
  computed: {
    loading() {
      return this.$store.getters.loading
    },
    counter() {
      return this.$store.getters.counter
    },
    scrollState(){
      return this.$store.getters.scroll
    }
  },
  watch: {
    text(value) {
      if (+value < 0) {
        this.text = -+value
      }
      if (+value > 9999) {
        this.text = 9999
      }
    }
  }
}
</script>
<style scoped>
.ui-wrapper {
  position: fixed;
  bottom: 10px;
  right: 10px;
  align-items: center;
  display: flex;
  z-index: 2;
}

.indicator {
  height: 60px;
  width: 60px;
  background: white;
  border-radius: 50%;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 1px 1px 15px 0px rgb(0 0 0 / 30%);
}

.wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding-top: 20px;
  min-height: 198px;
  box-sizing: border-box;
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
  margin-right: -35px;
  border-radius: 50px;
  border: none;
  outline: none;
  font-size: 16px;
  padding: 0px 10px;
  width: 70px;
  height: 40px;
  -webkit-appearance: none;
}
.controls button {
  border: none;
  outline: none;
  cursor: pointer;
  padding: 0px;
  margin-left: 10px;
  width: 50px;
  height: 50px;
  background: none;
  display: flex;
  justify-content: center;
  align-items: center;
}
.controls button .button-background {
  border-radius: 50%;
  width: 50px;
  height: 50px;
  background: linear-gradient(
    135deg,
    rgba(73, 72, 238, 1) 0%,
    rgba(114, 11, 244, 1) 100%
  );
  color: white;
  text-transform: uppercase;
  box-shadow: 1px 1px 15px 0px rgb(0 0 0 / 30%);
  transition: 0.2s ease-out;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
}
.controls button:active .button-background {
  width: 45px;
  height: 45px;
}
.controls button:disabled .searchIcon {
  color: red;
}
.github {
  position: absolute;
  font-size: 20px;
  top: 20px;
  right: 20px;
  border-radius: 24px;
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(
    135deg,
    rgba(255, 0, 0, 0.3) 0%,
    rgb(11, 112, 244) 100%
  );
  box-shadow: 3px 3px 8px 0px rgb(0 0 0 / 30%);
  transition: 0.2s;
}
.github:hover {
  opacity: 0.6;
}
.github a {
  margin-top:2px;
  padding: 30px;
  font-size: 150%;
  color: greenyellow;
  text-decoration: none;
}
.counter {
  color: blueviolet;
  background: white;
  height: 50px;
  display: flex;
  align-items: center;
  margin-right: -15px;
  padding-right: 20px;
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
  padding-left: 15px;
  font-weight: bold;
  font-size: 110%;
}

.counter a {
  margin: 0;
}
.searchIcon {
  color: greenyellow;
  transition: 0.2s;
}

/* .checkbox-hint{
  background: grey;
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.3s;
  position: absolute;
  bottom: 125%;
  left: 50%;
}
.checkbox-hint::after{
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: rgb(0, 0, 0) transparent transparent transparent;
} */
.checkbox {
  position: relative;
}
.checkbox::after {
  content: 'Auto-Scroll';
  background: grey;
  opacity: 0;
  transition: opacity 0.3s;
  position: absolute;
  bottom: 25px;
  right:-30px;
  min-width: 68px;
  border-radius: 12px;
  padding: 5px;
  color: white;
  background: rgba(11, 111, 244, 1);
  font-size: 12px;
}
.checkbox::before {
  content: '';
  position: absolute;
  content: "";
  position: absolute;
  transition: opacity 0.3s;
  opacity: 0;
  top: -5px;
  left: 53%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: rgba(11, 111, 244, 1) transparent transparent transparent;
}
.checkbox:hover::after {
  opacity: 1;
}
.checkbox:hover::before {
  opacity: 1;
}
@media only screen and (max-width: 500px) {
  .github {
    display: none;
  }
}
</style>

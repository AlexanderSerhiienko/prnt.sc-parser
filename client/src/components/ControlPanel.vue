<template>
  <div class="wrapper">
    <div class="github">
      <a href="https://github.com/AlexanderSerhiienko/prnt.sc-parser" target="_blank">
       Github
      </a>
    </div>
    <div id="scroll-top"></div>
    <div class="logo">
      <h1>Prnt.sc <span class="parser">Parser</span> </h1>
    </div>
    <h3>Enter the amount of photos</h3>
    <div class="controls">
      <input type="number" v-model="text" @keypress.enter="onSubmit" @change="checkInput" min="0" /> 
      <!-- maxlength not working idk why-->
      <button :disabled="loading" @click="onSubmit">
       <font-awesome-icon class ="searchIcon" icon="search"/>
      </button>
    </div>
    <transition 
      enter-active-class="animate__animated animate__fadeInRight"
      leave-active-class="animate__animated animate__fadeOutRight"
    >
      <div v-if="loading" class="ui-wrapper">
        <div class="counter">
          <span>{{counter.current}}/{{counter.total}}</span>
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
      validation:true
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
    }
  },
  computed: {
    loading() {
      return this.$store.getters.loading
    },
    counter() {
      return this.$store.getters.counter
    }
  },
  watch: {
    text (value) {
      if(+value<0)
      {
        this.text=-(+value)
      }
      if(+value>9999){
        this.text=9999
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
  margin-right:-35px;
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
  border-radius: 50%;
  border: none;
  outline: none;
  margin-left: 10px;
  padding: 9px;
  cursor: pointer;
  width:50px;
  height: 50px;
  background: linear-gradient(
    135deg,
    rgba(73, 72, 238, 1) 0%,
    rgba(114, 11, 244, 1) 100%
  );
  color: white;
  text-transform: uppercase;
   box-shadow: 1px 1px 15px 0px rgb(0 0 0 / 30%);
  transition: 0.2s;
}
.controls button:hover  {
  
}
.controls button:disabled .searchIcon{
  color:red;  
}
.github{
  position: absolute;
    top: 40px;
    right: 20px;
    border-radius: 18px;
     background: linear-gradient(135deg, rgba(255, 0, 0, 0.3) 0%, rgb(11, 112, 244) 100% );
    box-shadow: 3px 3px 8px 0px rgb(0 0 0 / 30%);
    transition: 0.2s;
}
.github:hover{
  opacity: 0.6;
}
.github a{
    padding:30px;
    font-size:150%;
    color:greenyellow;
    text-decoration: none;
}
.counter {
  /* padding:10px;
  box-shadow: 3px 3px 8px 0px rgb(0 0 0 / 30%);
  background: linear-gradient(135deg, rgba(255, 0, 0, 0.3) 0%, rgb(11, 112, 244) 100% );
  border-radius: 18px; */
  color: blueviolet;
  background: white;
  /* width: 100px; */
  height: 50px;
  display: flex;
  align-items: center;
  margin-right: -15px;
  padding-right: 20px;
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
  padding-left: 15px;
  font-weight: bold;
  font-size:110%;
}

.counter a{
  margin:0;
}
.searchIcon{
  color:greenyellow;
  transition: 0.2s;
}
@media only screen and (max-width: 600px) {
  .github {
    display: none;
  }
}
</style>

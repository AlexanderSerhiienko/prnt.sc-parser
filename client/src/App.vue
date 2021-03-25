<template>
  <div id="app">
    <div>
      <ControlPanel :loading="loading" @start-parsing="startParsing" :picture="pictures" />
    </div>
    <div class="picture-box">
      <PictureBox :pictures="pictures" />
    </div>
    <div id="scroll"></div>
  </div>
</template>

<script>
import axios from "axios";
import ControlPanel from "@/components/ControlPanel";
import PictureBox from "@/components/PictureBox";

export default {
  name: "App",
  data() {
    return {
      pictures: [],
      loading: false,
      el:''
    };
  },
  components: {
    PictureBox,
    ControlPanel,
  },
  methods: {
    async startParsing(number) {
      // this.pictures = [];
      // let id = "";
      // for (let i = 0; i < number; i++) {
      //   id = this.generateRandomEndpoint();
      //   console.log("endPoint: " + endPoint);
      //   // const res = await axios.get(`http://localhost:3000/${endPoint}`)
      //   this.pictures.push(`http://localhost:3000/${endPoint}`);
      //   // .then((res) => {
      //   //   console.log("response from my server: ");
      //   //   console.log(res);
      //   //   this.pictures.push(res.data);
      //   // });
      // }
      // console.log(this.pictures);
      this.pictures = []
      this.loading = true
      for (let i = 0; i< number; i++) {
        const {data} = await axios.get(`http://localhost:3000/rimg`)
        this.pictures.push(data)
        setTimeout(() => this.scrollBottom(), 300)
      }
      this.loading = false
    },
    scrollBottom() {
      this.el=document.getElementById('scroll')
      this.el.scrollIntoView({behavior: 'smooth'}) 
    },
    generateRandomEndpoint() {
      let result = "";
      const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
      const charactersLength = characters.length;
      for (let i = 0; i < 6; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }
      return result;
    }
  },
};
</script>

<style>
#app {
  width: 99.9%;
  border:2px solid black;
}
.picture-box {
  display: flex;
  width: 100%;
  height: 100%;
  flex-wrap: wrap;
  border:2px solid black;
}
</style>

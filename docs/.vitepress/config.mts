import { defineConfig } from 'vitepress'
import { withMermaid } from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid({
  title: "NapPlana.NET",
  description: "又一个基于.NET的NapCat开发SDK包",
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: '主页', link: '/' },
      { text: '关于', link: '/about/aboutus' },
      { text: 'API文档', link: 'https://ref.napplana.net'}
    ],
    
    sidebar: [
      {
        text: '快速开始',
        items: [
          { text: '简介', link: '/quick-start/introduction' },
          { text: '第一个机器人', link: '/quick-start/first-bot' }
        ]
      },
      {
        text: '示例程序',
        items: [
          { text: '戳一戳', link: '/examples/poke-back' },
        ]
      },
      {
        text: '关于',
        items: [
          { text: '关于我们', link: '/about/aboutus' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/stevesensei/NapPlana.NET' }
    ]
  },
  mermaid:{
    //mermaidConfig !theme here works for light mode since dark theme is forced in dark mode
  },
  mermaidPlugin: {
      class: "mermaid my-class", // set additional css classes for parent container 
  },
})
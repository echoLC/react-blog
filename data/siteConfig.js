module.exports = {
  siteTitle: 'echoLC',
  siteDescription: 'A React blog which build to use Gatsby',
  authorName: 'echoLC',
  twitterUsername: 'echoLC',
  authorAvatar: 'avatar.jpeg', // file in content/images
  defaultLang: 'zh_cn', // show flag if lang is not default. Leave empty to enable flags in post lists
  authorDescription: `来自欢聚集团的前端开发开发工程师，现居广州。`,
  siteUrl: 'https://echolc.github.io/',
  disqusSiteUrl: 'https://echolc.github.io/',
  // Prefixes all links. For cases when deployed to maxpou.fr/gatsby-starter-morning-dew/
  pathPrefix: '/', // Note: it must *not* have a trailing slash.
  siteCover: 'huoyingzhishui.jpg', // file in content/images
  googleAnalyticsId: 'UA-67868977-2',
  background_color: '#ffffff',
  theme_color: '#222222',
  display: 'standalone',
  icon: 'content/images/baymax.png',
  postsPerPage: 6,
  disqusShortname: 'echoLC',
  headerTitle: 'echoLC',
  headerLinksIcon: 'baymax.png', //  (leave empty to disable: '')
  headerLinks: [
    {
      label: '博客',
      url: '/',
    },
    {
      label: '关于',
      url: '/about',
    }
  ],
  // Footer information (ex: Github, Netlify...)
  websiteHost: {
    name: 'GitHub',
    url: 'https://github.com',
  },
  footerLinks: [
    {
      sectionName: '探索',
      links: [
        {
          label: '博客',
          url: '/',
        },
        {
          label: '关于',
          url: '/about',
        }
      ],
    },
    {
      sectionName: '关注我',
      links: [
        {
          label: 'GitHub',
          url: 'https://github.com/echoLC',
        },
        {
          label: '网站',
          url: 'https://echolc.github.io/',
        },
        {
          label: '掘金',
          url: 'https://juejin.im/user/3702810893618253',
        },
      ],
    },
  ],
}

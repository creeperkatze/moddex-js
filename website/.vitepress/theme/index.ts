import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';

import SponsorButton from './SponsorButton.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-content-after': () => h(SponsorButton),
    });
  },
};

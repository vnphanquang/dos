---
inject: true
to: "<%= category === 'mixin' ? 'src/lib/client/styles/globals/mixins/index.cjs' : null %>"
after: HYGEN INJECTION MARKER
skip_if: <%= name %>
---
  ...require('./<%= name %>.cjs'),
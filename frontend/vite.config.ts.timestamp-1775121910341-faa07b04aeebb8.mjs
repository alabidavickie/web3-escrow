// vite.config.ts
import { defineConfig } from "file:///C:/Users/new/OneDrive/Desktop/web3%20escrow/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/new/OneDrive/Desktop/web3%20escrow/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import mkcert from "file:///C:/Users/new/OneDrive/Desktop/web3%20escrow/frontend/node_modules/vite-plugin-mkcert/dist/mkcert.mjs";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\new\\OneDrive\\Desktop\\web3 escrow\\frontend";
var vite_config_default = defineConfig({
  plugins: [react(), mkcert()],
  server: { https: true },
  resolve: {
    alias: {
      "@": "/src",
      // Stub out the optional starkzap peer dep that isn't installed
      "@fatsolutions/tongo-sdk": path.resolve(__vite_injected_original_dirname, "src/stubs/tongo-sdk.ts")
    }
  },
  // Polyfill Node.js globals that starknet.js / starkzap may reference
  define: {
    "process.env": {},
    global: "globalThis"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxuZXdcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFx3ZWIzIGVzY3Jvd1xcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcbmV3XFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcd2ViMyBlc2Nyb3dcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL25ldy9PbmVEcml2ZS9EZXNrdG9wL3dlYjMlMjBlc2Nyb3cvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgbWtjZXJ0IGZyb20gJ3ZpdGUtcGx1Z2luLW1rY2VydCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCksIG1rY2VydCgpXSxcbiAgc2VydmVyOiB7IGh0dHBzOiB0cnVlIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiAnL3NyYycsXG4gICAgICAvLyBTdHViIG91dCB0aGUgb3B0aW9uYWwgc3Rhcmt6YXAgcGVlciBkZXAgdGhhdCBpc24ndCBpbnN0YWxsZWRcbiAgICAgICdAZmF0c29sdXRpb25zL3RvbmdvLXNkayc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvc3R1YnMvdG9uZ28tc2RrLnRzJyksXG4gICAgfSxcbiAgfSxcbiAgLy8gUG9seWZpbGwgTm9kZS5qcyBnbG9iYWxzIHRoYXQgc3RhcmtuZXQuanMgLyBzdGFya3phcCBtYXkgcmVmZXJlbmNlXG4gIGRlZmluZToge1xuICAgICdwcm9jZXNzLmVudic6IHt9LFxuICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXdWLFNBQVMsb0JBQW9CO0FBQ3JYLE9BQU8sV0FBVztBQUNsQixPQUFPLFlBQVk7QUFDbkIsT0FBTyxVQUFVO0FBSGpCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDO0FBQUEsRUFDM0IsUUFBUSxFQUFFLE9BQU8sS0FBSztBQUFBLEVBQ3RCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUs7QUFBQTtBQUFBLE1BRUwsMkJBQTJCLEtBQUssUUFBUSxrQ0FBVyx3QkFBd0I7QUFBQSxJQUM3RTtBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBRUEsUUFBUTtBQUFBLElBQ04sZUFBZSxDQUFDO0FBQUEsSUFDaEIsUUFBUTtBQUFBLEVBQ1Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=

# TableView AR — MVP 0.1

A mobile-first, web-hosted restaurant AR menu prototype.

## What is implemented

- QR/deep-link friendly URL (`?restaurant=bistro-demo&table=14`)
- Mobile camera preview (permission required)
- 3D dish preview
- Swipe/click dish carousel
- Three local demo GLB food models
- Device AR handoff via `<model-viewer>` (`webxr`, `scene-viewer`, `quick-look`)
- Dish details and ingredient chips
- Customization options
- Local basket/order state
- Table number propagated into the order UI
- Ordering backend intentionally left disabled for the next stage

## Run locally

Camera access normally requires HTTPS, except browsers generally allow `localhost` for development.

From this folder:

```bash
python -m http.server 8080
```

Open:

```text
http://localhost:8080/?restaurant=bistro-demo&table=14
```

For testing on a physical phone, host the folder on an HTTPS site (for example a static hosting provider) and open the HTTPS URL or QR code.

## Device behavior

The app uses `<model-viewer>` to choose the best available AR route:

- Android: WebXR when supported, otherwise Scene Viewer.
- iPhone/iPad: Apple AR Quick Look fallback.
- Desktop/unsupported device: interactive 3D preview remains available.

The persistent web carousel is available in the main web interface. A platform-native AR handoff, especially iOS Quick Look, may not preserve the custom web overlay while AR is open. That is a platform limitation we should account for in the next iteration rather than hiding it.

## Replace the demo dishes

Add `.glb` files under `assets/models/` and add corresponding records in the `dishes` array at the top of `app.js`.

For real deployment, dish models should be created at real-world dimensions so AR scale is meaningful.

## Next engineering milestone

1. Deploy to HTTPS and generate a real QR code.
2. Test on iPhone + two ARCore Android phones.
3. Improve persistent in-AR dish switching on WebXR devices.
4. Add a backend schema for restaurants, tables, dishes, ingredients and orders.
5. Add a restaurant dashboard that receives submitted orders.

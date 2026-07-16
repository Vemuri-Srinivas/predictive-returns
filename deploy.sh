#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Building UI..."
cd "$ROOT/ui"
npm run build
cd "$ROOT/ui/dist"
zip -r /tmp/predictivereturns_good.zip assets index.html manifest.json xs-app.json Component.js

echo "Running mbt build..."
cd "$ROOT"
mbt build

echo "Patching mtar with correct zip..."
python3 - <<'PYEOF'
import zipfile

src_mtar = 'mta_archives/predictivereturns_1.0.0.mtar'
out_mtar = '/tmp/predictivereturns_final.mtar'
good_zip = '/tmp/predictivereturns_good.zip'
data_zip_path = '/tmp/data_final.zip'

with zipfile.ZipFile(data_zip_path, 'w', zipfile.ZIP_DEFLATED) as dz:
    dz.write(good_zip, 'predictivereturns.zip')

target_entry = 'predictivereturns-app-deployer/resources/data.zip'
with zipfile.ZipFile(src_mtar, 'r') as zin:
    with zipfile.ZipFile(out_mtar, 'w', zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == target_entry:
                with open(data_zip_path, 'rb') as f:
                    zout.writestr(item.filename, f.read())
            else:
                zout.writestr(item, zin.read(item.filename))

print('Mtar patched successfully.')
PYEOF

echo "Deploying..."
cf deploy /tmp/predictivereturns_final.mtar --retries 1

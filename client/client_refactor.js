import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const clientSrcPath = 'c:/Users/User/OneDrive/Documents/3312411050/SEMESTER 4/IF-MC-07/Eco-light-Space-Optimizer/eco-light-space-optimizer/client/src';
const featuresPath = path.join(clientSrcPath, 'features');

// 1. Rename feature folders
const folderRenames = {
  'jadwal-otomatisasi': 'automation-schedule',
  'kamera': 'camera',
  'perangkat-iot': 'iot-device',
  'sensor-daya': 'power-sensor',
  'zona': 'zone'
};

for (const [oldName, newName] of Object.entries(folderRenames)) {
  const oldPath = path.join(featuresPath, oldName);
  const newPath = path.join(featuresPath, newName);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed folder ${oldName} to ${newName}`);
  }
}

// 2. Ensure structure for all features
const features = [
  'automation', 'dashboard', 'energy-monitor', 'automation-schedule',
  'camera', 'monitoring', 'iot-device', 'profile', 'rooms',
  'savings', 'power-sensor', 'zone', 'auth'
];

for (const feature of features) {
  const featDir = path.join(featuresPath, feature);
  if (!fs.existsSync(featDir)) {
      fs.mkdirSync(featDir, { recursive: true });
  }

  const subdirs = ['api', 'components', 'hooks', 'types'];
  for (const subdir of subdirs) {
    const subPath = path.join(featDir, subdir);
    if (!fs.existsSync(subPath)) {
      fs.mkdirSync(subPath, { recursive: true });
    }
    
    if (subdir === 'components') {
      const gitkeep = path.join(subPath, '.gitkeep');
      if (!fs.existsSync(gitkeep)) {
        fs.writeFileSync(gitkeep, '');
      }
    } else {
      const indexFile = path.join(subPath, 'index.ts');
      if (!fs.existsSync(indexFile)) {
        const title = subdir.charAt(0).toUpperCase() + subdir.slice(1);
        fs.writeFileSync(indexFile, `// ${title} for ${feature}\n`);
      }
    }
  }
}

// 3. Rename specific hooks
const fileRenames = [
  {
    oldPath: path.join(featuresPath, 'zone', 'hooks', 'useZona.ts'),
    newPath: path.join(featuresPath, 'zone', 'hooks', 'useZone.ts')
  },
  {
    oldPath: path.join(clientSrcPath, 'hooks', 'useRuangan.ts'),
    newPath: path.join(clientSrcPath, 'hooks', 'useRoom.ts')
  },
  {
    oldPath: path.join(clientSrcPath, 'hooks', 'useKontrol.ts'),
    newPath: path.join(clientSrcPath, 'hooks', 'useControl.ts')
  }
];

for (const rename of fileRenames) {
  if (fs.existsSync(rename.oldPath)) {
    fs.renameSync(rename.oldPath, rename.newPath);
    console.log(`Renamed file ${path.basename(rename.oldPath)} to ${path.basename(rename.newPath)}`);
  }
}

// 4. Update contents across client/src
const replaceMap = [
  ['jadwal-otomatisasi', 'automation-schedule'],
  ['kamera', 'camera'],
  ['perangkat-iot', 'iot-device'],
  ['sensor-daya', 'power-sensor'],
  ['/zona', '/zone'],
  ['useZona', 'useZone'],
  ['useRuangan', 'useRoom'],
  ['useKontrol', 'useControl']
];

function getAllFiles(dirPath, arrayOfFiles) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });
  return arrayOfFiles;
}

const allFiles = getAllFiles(clientSrcPath);

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  for (const [oldStr, newStr] of replaceMap) {
    newContent = newContent.split(oldStr).join(newStr);
  }

  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated imports in ${path.basename(file)}`);
  }
}

try {
  const output = execSync('tree "' + featuresPath + '" /A /F', { encoding: 'utf8' });
  console.log("=== TREE OUTPUT ===");
  console.log(output);
} catch(e) {
  console.log('tree command failed');
}

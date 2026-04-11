import os
import shutil
import random

SOURCE_IMAGES = r'C:\Users\User\OneDrive\Documents\3312411050\SEMESTER 4\IF-MC-07\Eco-light-Space-Optimizer\eco-light-space-optimizer\service_ai\data\train\images'
SOURCE_LABELS = r'C:\Users\User\OneDrive\Documents\3312411050\SEMESTER 4\IF-MC-07\Eco-light-Space-Optimizer\eco-light-space-optimizer\service_ai\data\train\labels'
DEST          = r'C:\Users\User\OneDrive\Documents\3312411050\SEMESTER 4\IF-MC-07\Eco-light-Space-Optimizer\eco-light-space-optimizer\service_ai\data'

VALID_RATIO = 0.1
TEST_RATIO  = 0.1

for split in ['valid', 'test']:
    os.makedirs(os.path.join(DEST, split, 'images'), exist_ok=True)
    os.makedirs(os.path.join(DEST, split, 'labels'), exist_ok=True)

images = [f for f in os.listdir(SOURCE_IMAGES) 
          if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
random.shuffle(images)

total   = len(images)
n_test  = int(total * TEST_RATIO)
n_valid = int(total * VALID_RATIO)

test_files  = images[:n_test]
valid_files = images[n_test:n_test + n_valid]

print(f"Total gambar : {total}")
print(f"Train        : {total - n_test - n_valid}")
print(f"Valid        : {n_valid}")
print(f"Test         : {n_test}")

def move_files(file_list, split_name):
    moved = 0
    for img_file in file_list:
        name       = os.path.splitext(img_file)[0]
        label_file = name + '.txt'

        src_img = os.path.join(SOURCE_IMAGES, img_file)
        dst_img = os.path.join(DEST, split_name, 'images', img_file)
        shutil.copy2(src_img, dst_img)  # pakai copy dulu, bukan move

        src_lbl = os.path.join(SOURCE_LABELS, label_file)
        dst_lbl = os.path.join(DEST, split_name, 'labels', label_file)
        if os.path.exists(src_lbl):
            shutil.copy2(src_lbl, dst_lbl)

        moved += 1
    print(f"  {split_name}: {moved} file berhasil dicopy")

move_files(test_files,  'test')
move_files(valid_files, 'valid')

print("\nSelesai! Cek folder valid dan test.")
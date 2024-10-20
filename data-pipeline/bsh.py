import os
import json

# from iiif_downloader import Manifest
from downloader import Manifest
from ocrmac import ocrmac
from rich.progress import track


BASE_URL = "https://bibliotekadigjitale.bksh.al/iiif/Manifester/IIIF"
MANIFEST_URL_MRIZI_I_ZANAVE = f"{BASE_URL}/libra!HASHae57.dir"
MANIFEST_URL_KRYENGRITJA_SHQIPTARE = "https://bibliotekadigjitale.bksh.al/iiif/Manifester/IIIF/libra1!HASH8b45!94a869fc.dir"
IMAGE_BASE_URL = "https://bibliotekadigjitale.bksh.al/iiif/Scaler/IIIF/"


# https://bibliotekadigjitale.bksh.al/?view=ImageView&manifest=https%3A%2F%2Fbibliotekadigjitale.bksh.al%2Fiiif%2FManifester%2FIIIF%2Flibra1%21HASH8b45%2194a869fc.dir&canvas=https%3A%2F%2Fbibliotekadigjitale.bksh.al%2Fiiif%2FManifester%2FIIIF%2Flibra1%21HASH8b45%2194a869fc.dir%2Fcanvas%2Fp27


def download_images(manifest_url):
    Manifest(url=manifest_url).save_images()


def get_image_url(img_name):
    """Example:
    https://bibliotekadigjitale.bksh.al/iiif/Scaler/IIIF/libra1!HASHae57.dir!page120/full/,1500/0/default
    """

    return f"{IMAGE_BASE_URL}{img_name}/full/,1500/0/default"


def annotate_collection():
    with open("output.json", "w") as f:
        output = []
        image_dir = "./iiif-downloads/images/"
        sorted_img_names = sorted(
            os.listdir(image_dir),
            key=lambda x: int(x.split("!page")[1].removesuffix(".png")),
        )

        for i in track(range(len(sorted_img_names)), description="Processing..."):
            # f.write("-------------------------------------------------\n")
            # f.write(f"Skanimi: {get_image_url(img_name)}")
            # f.write("\n" * 3)

            img_name = sorted_img_names[i]
            annotations = ocrmac.OCR(f"{image_dir}/{img_name}").recognize()
            text = [[text, confidence] for text, confidence, _ in annotations]
            # for text, confidence, bounding_box in annotations:
            #     f.write(text)
            #     f.write("\n")

            # f.write("\n" * 5)
            output.append([get_image_url(img_name), text])

        f.write(json.dumps(output, indent=2))


def main():
    # download_images(MANIFEST_URL_KRYENGRITJA_SHQIPTARE)
    annotate_collection()


if __name__ == "__main__":
    main()

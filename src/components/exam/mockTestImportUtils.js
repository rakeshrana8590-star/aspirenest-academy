export const convertGoogleDriveUrlToDownloadUrl = (url = "") => {
    const fileIdMatch =
      url.match(/\/d\/([^/]+)/) ||
      url.match(/[?&]id=([^&]+)/);
  
    if (!fileIdMatch?.[1]) {
      return url;
    }
  
    return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
  };
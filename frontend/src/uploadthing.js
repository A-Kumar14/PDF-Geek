import { generateReactHelpers } from "@uploadthing/react";

const url = process.env.REACT_APP_UPLOADTHING_URL || "/api/uploadthing";

export const { useUploadThing, uploadFiles } = generateReactHelpers({
  url,
});

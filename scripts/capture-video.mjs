/**
 * Captures marketing GIFs of nycgrid.vercel.app using Playwright + gifski.
 * Frames are captured as lossless 2x Retina PNGs — no video encode in the pipeline.
 * Output saved to scripts/screenshots/gifs/, named with time-of-day suffix.
 *
 * Usage:
 *   bunx playwright install chromium  (first time only)
 *   node scripts/capture-video.mjs
 *
 * Best results:
 *   Day footage (cameras bright, Times Sq readable): run before 4pm
 *   Night footage (atmospheric, lights/rain):        run after 8pm
 *
 * Optional: point at local dev instead
 *   BASE_URL=http://localhost:3100 node scripts/capture-video.mjs
 */

import { chromium } from "@playwright/test";
import { mkdirSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const BASE_URL = process.env.BASE_URL ?? "https://nycgrid.vercel.app";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "screenshots");
const TEMP = join(ROOT, ".frames-tmp");

// Each run gets its own timestamped folder: gifs/2026-04-26T20-08/
const RUN_TS = new Date()
  .toISOString()
  .slice(0, 16)
  .replace("T", "T")
  .replace(":", "-")
  .replace(":", "-");
const GIFS = join(ROOT, "gifs", RUN_TS);

mkdirSync(GIFS, { recursive: true });

// Time-of-day tag: day = before 4pm ET, night = after 8pm ET, golden = 4-8pm
const hour = new Date().toLocaleString("en-US", {
  timeZone: "America/New_York",
  hour: "numeric",
  hour12: false,
});
const h = parseInt(hour, 10);
const TOD = h < 16 ? "day" : h >= 20 ? "night" : "golden";
console.log(`🕐  Time of day: ${TOD} (${h}:00 ET) — outputs will be tagged -${TOD}`);

function gifPath(name) {
  return join(GIFS, `${name}-${TOD}.gif`);
}

// Curated cameras: major NYC roads, bridges, and landmarks (273 cameras = ~28% of pool)
// Any of these is a recognisable NYC location worth showing in a GIF.
const CURATED_IDS = new Set([
  "8a6bc417-4877-4ebe-8052-88c1b261baf1",
  "ec1e7b42-18de-4475-8c89-9e80f21e5b6c",
  "0039e6bf-5244-4b4e-b7dc-d02056bbfdc9",
  "4f8c2e84-c15a-4474-91fb-7e14554d4c4e",
  "8d2b3ae9-da68-4d37-8ae2-d3bc014f827b",
  "8afc5cd6-f735-47e8-bd57-6e6d3b81b442",
  "053e8995-f8cb-4d02-a659-70ac7c7da5db",
  "332f161d-47cb-4c8a-b6b6-5ad48a55c978",
  "8e07d72b-94cd-44c4-b92a-48decda031d2",
  "984ebbad-ca64-41d8-8008-63aaae316952",
  "cb68b8b1-9093-4f2e-acf2-8133b047e8df",
  "2f28f8df-5eb5-4327-ab1f-7feaf2630b34",
  "155b2bff-5dd2-4109-bd10-e098376c8476",
  "b5d8fe4f-1cf5-4cd8-8211-8353e68da1cb",
  "279720e5-7db3-4143-9608-531cfc50dc25",
  "0bbea8bd-10f1-4126-b3c5-9e9432eab749",
  "6847c104-0117-4e3f-b30e-e1a859bc8107",
  "f06979b2-3497-4330-9882-a06c8a442b7c",
  "39b42007-16d8-4302-8b8c-602bbb9e9683",
  "34674be5-4791-47f1-b0b2-2db0ff619732",
  "9b4553f1-6aa3-46eb-8905-ecbfecb83ce3",
  "c3cda16b-e979-48bd-8672-4098194d2dbe",
  "6d3a21dd-0434-4d92-a0d1-3ca8b77297db",
  "e229e0fd-559b-4c1e-bcba-ac23db1d01e3",
  "08328372-55a2-448a-b180-9b4bce0b8d9e",
  "41397b64-d035-4b41-a03e-170fe4103d89",
  "9c4c2657-6796-4953-bbe6-c50f24bb5820",
  "20b2298a-90cf-463f-b172-0b398a34f061",
  "83655dbc-7902-4fdb-926c-15fee4396b83",
  "ecba28cb-ac70-4d25-abcb-6506111ea120",
  "20503e73-1829-4275-a645-5be6a02fd7cd",
  "243e945a-b872-4bac-9898-94ce8963ef44",
  "2e43a9d0-1df8-4a38-ae20-2e0f359bb55d",
  "a0ecf291-582c-4c42-933f-0b9ed4ce885c",
  "053afe02-e1b3-4bea-9995-787e72c7fff4",
  "5adef8a1-5ad0-4a73-8d87-e1e545ba8cbb",
  "1dc7794b-62bb-4cb7-93ee-df87e5ac671d",
  "9955d671-39ad-4fb7-b63e-4e78cf6ac157",
  "0dc7c2b4-614d-46a3-9610-3ba09f3f1284",
  "2f504422-66f8-4ddc-805f-8744279a1a6e",
  "04ffc69c-92a7-4c02-aa18-2b16e7ba81f2",
  "06ea08ec-5cd8-4bd6-9535-502acf651abc",
  "60fbce69-38fa-42b2-9ae8-41aea66abddf",
  "60982889-171e-4208-ae1d-8f179f91231e",
  "abda729c-9f02-4ecf-b164-228b1528cfac",
  "ccd1abb9-0683-4d93-a62f-b2b121612d28",
  "0bf496dc-36dd-4311-808e-84ab6acec605",
  "5caa3ace-277b-42db-97bd-585f29b0d49f",
  "ae2f7e1a-e781-4d24-9434-12f4f4ef4f2b",
  "17b6c7dd-2aa7-442a-8832-d39051a47d1b",
  "36d14f1c-b6fb-474c-9703-ecfd101ead72",
  "b062d611-e0e8-40be-a180-c583391276f5",
  "301002c0-fe39-4fad-998a-fdc66e531b1d",
  "24101bcf-29a7-4417-b77d-1f0368dc212d",
  "af741eca-a192-41be-890a-22c7ae7d159a",
  "65440c6b-ee6c-4406-8542-2992b6edf3f5",
  "19c66e73-e218-42d8-af0b-a0ca53e6bf86",
  "8c1ea3b6-0db6-4222-ba50-2545f8f82d71",
  "5c505897-b475-4359-897d-b064bdb9feef",
  "97190ee9-e92c-46ef-a3fc-e8c75d416a9a",
  "9cdf1f47-307d-48e8-8627-e77e189b5fed",
  "0a49d947-2a5b-498d-a386-2cef5ce883fa",
  "1dddf912-4718-4b2a-94dd-1f793a9ed22c",
  "3a3cf44d-6c42-46fb-b774-1441a8582076",
  "57e5f44a-4515-4bc2-877b-e6373fce5a66",
  "1927b469-e2dc-4943-a70c-e6e52fd4c48c",
  "0ad90cca-a6b0-4968-abdd-ca81ae497848",
  "9565e94d-66f2-4965-9c13-82d5500d6cfd",
  "5ea363ef-b9d6-4863-967a-0b4ba9cb0bf5",
  "10a4be9a-8a1e-4b0c-84c3-b51c887b5e27",
  "482e6d35-2a67-4bbf-b36f-fdf7e031d607",
  "04589f46-2429-4e26-ad46-12a1198e9a9c",
  "03d9fe0d-7c26-4929-a350-ab0a58a430c6",
  "c361e170-2da7-4e96-9546-296e766b37ad",
  "2a0ec6ff-9284-466a-9785-9f6df84ea4cf",
  "2fe54994-17f6-499d-a3ab-8c6dc9dbda9e",
  "40ffec9e-3d55-454f-927e-6a602869a451",
  "38a24ab1-f962-4acd-b8b4-8f043b149865",
  "25ad72fe-e74c-49af-b4c0-34c9eac14655",
  "5a9ebe48-fb36-4de7-8666-f50de83c7941",
  "67ef8775-026c-4152-8a81-c7251e0677ca",
  "97ace0b4-fcd2-4c3a-8c05-dbf73639ead3",
  "2e0d5197-6073-411f-9d1a-326b30841679",
  "1e627100-9bce-4e78-bcd3-736344a2236c",
  "37e2a4b6-2fbd-42f5-9d2d-130b664783f2",
  "8ee72946-49e0-4f49-991d-4f52b1206ed7",
  "421960d6-54a8-4f12-a5ee-7a07390def4c",
  "8645493f-d08c-4c0e-a572-b40f5fbeec56",
  "cc6c54fa-43fb-4484-a598-20feea2adb89",
  "6dd4b946-8704-4690-aa87-017a19e778c5",
  "0267c1e2-6eaf-49d4-a063-df89e9242993",
  "a409e9bd-6a0f-4cdc-81d8-290d5709dc74",
  "16de4b9a-83fe-4d11-91cd-d775cc1e559c",
  "879ab924-18ac-4779-a681-395d73a0f0cc",
  "0ff11926-fcf0-4e3b-8aea-ffc0ea4f2228",
  "7033b4d2-13e5-4405-ab86-da33c12734c3",
  "7cfc551d-403d-46a8-aa74-89f472b7136b",
  "08c40d18-cacf-4139-aa64-ba8f8602af53",
  "7a183d27-7c22-4014-ac9a-726efa472c79",
  "6c2996f1-3d8f-44a9-8ce0-a827ae8d3680",
  "3f85b7f5-564d-4098-9ffd-580ab6f88ed5",
  "4f3f56e3-f68e-4b60-a4ba-153ecb9094f7",
  "28107d1c-08da-4cd3-9777-09471ca30225",
  "cda76289-afd2-498e-a0e9-420a1854c38a",
  "36b00c79-b2a0-49d3-800a-42b7db1847a8",
  "49a571bf-f15e-4726-9937-aadde6c837ba",
  "bf8404ae-6ab7-47a1-8b3e-2f57f537a71f",
  "4048d465-2272-446e-bccb-c49ea6d62bd3",
  "24c402b2-915d-49f8-9529-f723a171c134",
  "3dc1adcd-7a47-45c3-a667-9d8fae9fdcd0",
  "bff66919-97a3-47ca-b16d-ca07ff93a546",
  "90775fd8-1c70-42f1-aee1-594db85be7ba",
  "180dcc87-d861-43e3-8898-9ad5ee1a26a9",
  "0b4bd3d3-1741-49b3-87cc-d0960fa5f424",
  "52399045-4691-4258-8f82-12000f5719a8",
  "9fda4742-9a18-4a32-b090-8825b201f0d5",
  "9961488a-3ce7-4a4e-ba05-bb960fd32e4e",
  "7e36617c-4210-4371-90df-89cfc2d25df2",
  "8cd15417-5b79-4065-9165-4b6ff0ff3f53",
  "a23d8461-9d7c-4e11-a392-777ef35b48ba",
  "35a808cf-7e4d-4ca5-891d-36ac48518662",
  "a40475d9-6266-4f92-b695-bb6addd39892",
  "3486cafa-aab2-418a-baa4-89dcc438e8c9",
  "6b81f2fd-acf3-4af2-adc1-42250156ece8",
  "aacb43bf-ed37-44c6-a2fe-8449a7851306",
  "311fa910-d8d6-4dde-acd4-ebaf275eba77",
  "73b66e92-508f-407c-bada-883ab992fde0",
  "2cde9c13-0146-4d4a-8d26-b6e7d34d9eec",
  "404fac12-9b5c-430b-a01b-12b50d39521c",
  "0c9a2836-c408-48d3-85c7-1977c33d9133",
  "beda95e2-f7d1-43a3-9a8b-7ab89e03f296",
  "6851bbf7-e079-4379-b021-e5c7dafcb8c9",
  "a8b56a8b-1451-4290-9d8f-c770f80c855a",
  "434094f8-1be4-4c19-8067-1e11049e46b4",
  "b6558fc0-d62b-4b25-b7aa-6b592bde2c44",
  "43bb4857-e86e-4775-916e-6b26cedaf554",
  "8437bc26-9eb8-4915-93f7-f8ea4170e739",
  "bb9ce48d-0458-4493-89ad-ae51065b5796",
  "bf5db978-c464-44c9-ac88-af9977af4505",
  "2191c11c-1757-4938-a608-a2c6ae0e6486",
  "43a4279e-de3a-4ab3-8c86-b268eb5e8848",
  "4850e464-1111-4b5d-a72d-f54a0e12a789",
  "50725dbd-6e39-4ed0-aa3b-89f9c8feff4e",
  "3309fba1-cc5f-483a-92bc-7d85951f1558",
  "fbaafcae-6f48-46ab-b6c7-b8919bcd5986",
  "63e79f0b-7dea-4c8e-864c-f3315f9cc62c",
  "5214cfe8-ccfc-42e9-8e2a-ff2865c1a518",
  "53de1e7c-8443-47fa-8603-4e5ef0466c17",
  "769a2e94-5bbc-4a03-86a7-39d3a70213f7",
  "d1363c77-e061-4414-be82-e6d749254859",
  "b5a78bda-3ca9-4ad4-bd03-4cee70baba2d",
  "11ab327a-184e-4630-b510-485d18e4a896",
  "c2b6f1ab-8baa-4384-9dc9-5bd2e374701e",
  "d1c219c0-afdd-4fa4-a72c-cc1b1318b99d",
  "3d8e276f-b179-414d-a506-679d5e559d3e",
  "5507fab3-3430-4747-a9ab-ed9f7b5ba959",
  "c5040f93-f4ec-4803-8370-8b931b0443e2",
  "1eb66413-6761-4eb0-bc04-e2533bb74b42",
  "c880d0c4-db84-44c2-9f00-62f21a83b5d0",
  "b7e5959c-1fc5-4fd2-a73e-426127b587b1",
  "c6d013c9-e69b-4824-8dad-b6580491d916",
  "418ae598-7cdd-48ff-8aea-97fc3d312407",
  "d8122408-7092-41ba-a9db-ef8847edeaef",
  "c6d82dbd-1c49-478f-819f-a38c1826b628",
  "bcafb919-3f51-4caa-b964-d6888ed4cecf",
  "0952329e-6b6f-4286-b5e3-b682eae94e52",
  "ca545979-d0c1-4735-88d6-61b6311bb6bc",
  "77794e28-5ee9-4fdd-8c14-2615c46d8a40",
  "c34ca47e-e375-4b9f-a8d7-f9737566b783",
  "5f9ef54f-f3ac-4ce9-ad39-2e483467867a",
  "3f04a686-f97c-4187-8968-cb09265e08ff",
  "8d7e94a5-7a81-4e92-8171-9f6c0f0ca7bf",
  "cbb04872-5f62-4989-acaa-e4166fa7c819",
  "dd374f35-08c9-482d-ae36-ce8e7c0cfb54",
  "a356e2c6-7d95-4d93-85c1-da3d05485d8c",
  "2589c0d6-c389-4861-b812-4ae68f560eba",
  "62380b5a-8960-4c2b-9125-d7f088605a7f",
  "5531396b-856d-429b-8bde-a845ef87aead",
  "83d034f2-584b-4dab-9e3d-d70a59995dc5",
  "8933100a-8229-42fe-b4b2-265db410d7ae",
  "0f3b6031-fe36-43df-b2c7-6120e0580309",
  "cd949f21-54b2-4d11-8aae-4ffba8654271",
  "9e3164a8-1c63-4790-bc24-f9d752f3ae41",
  "9d7c4525-fba3-4ffe-ae79-f814f7dccf4e",
  "9e3e26ae-d49f-4f64-ba99-113b779c25a2",
  "03a8a2da-3ac2-45aa-a5ba-4ff7d1ecbd22",
  "ce81bdbd-967b-4ad0-ab40-c4628bb59560",
  "326b2bab-d277-4c5a-9778-a7af791ad151",
  "d138b651-e2ed-4065-a0f9-ef56a65f61d4",
  "b47d139f-69ae-427e-86b4-f970f9e990e1",
  "d05b98ae-f2a7-4c26-8238-754081877484",
  "e278de5c-4cfa-46e7-aa85-59512db61f0d",
  "d1d8cd99-7609-409a-a739-f5913dabf4e6",
  "d78ebdc6-2211-479e-bda6-59d79db20258",
  "1546f761-039c-4b5c-af5e-75c83c9f603f",
  "5361a6ea-95fe-44e1-99f8-dc7d6964a427",
  "db1570e7-17a4-4916-9f42-cc8ca17aa42e",
  "d83aed40-b117-424b-8caf-35c3afe82527",
  "5c29ba71-1757-45db-8318-e1a2bad57e75",
  "d872e1a0-8c5f-47da-9469-bf40a3673ade",
  "7a830ac8-1cce-4a85-b3de-44d74900b9bc",
  "6bfee8ce-9d91-4ffb-9586-9b3a0675578d",
  "e016c2e4-a602-4c4d-ab9e-fadfa7f4e703",
  "e0ac368d-414a-4606-bea5-236e94a2d5b5",
  "78292730-3cfe-4f84-a6f7-d438f684849a",
  "76faba94-f9e5-42d7-981e-0cbbbfd4bc21",
  "85312947-96ae-4fce-a1f6-c6167e2f3004",
  "7a7016c5-a086-40fd-9298-90f17f8b6cea",
  "8820f260-11c9-49dd-8839-0ff47707b6f2",
  "f801cf2f-cd02-4077-aa53-99ee8a00e1ab",
  "78a5c61d-9dce-4b52-b0da-bf7d22c1f501",
  "adc07b1d-e5e1-45da-bfb7-db8a0519f231",
  "8c13c3b4-b227-4278-9beb-e58314c042d5",
  "7e2400e3-cad2-407a-927b-d575a35048e3",
  "7f865d20-e4f4-4f7c-88db-c0edf88a9501",
  "f4c47f52-9c8d-494a-92da-4dcc09a19fab",
  "82b0f566-cab5-4366-bc3a-67f82cc4fec7",
  "e49e8537-9891-44ba-ac1f-41db307934cf",
  "822f0cb4-827d-41cd-8f35-2b328a8c1d24",
  "dbbf45f6-7d87-46fa-825f-454a7e2bbcad",
  "821d0c4e-f43f-4968-ad2d-566e40e53df6",
  "dcef88ca-8811-4b82-8fa9-50225dd03bc4",
  "bb39deae-1c17-429a-a493-e7144408d011",
  "b591a4be-a1aa-4978-ab2c-be4a17eb190e",
  "85809312-60f2-4a52-a694-82628529c05a",
  "defa5e30-d6c7-4582-9ceb-03ff0fe7b93a",
  "81db80c2-13fe-4ae7-8b47-c08aa42d512f",
  "c0e47f5d-29d0-4103-9c69-9e461334a21b",
  "7b0f1486-6c0c-4bd4-ac8b-800c4bf2176e",
  "e6ba1d11-d27e-441f-b385-a8ae85a3fc74",
  "e64ec820-69c4-4cc9-b573-4d7d66c4a7eb",
  "b9085289-750b-403a-8031-681678d35ae0",
  "874223a4-dc80-4764-8d91-1590cd3737d4",
  "7c9ef8dd-7587-4e39-b486-13ef4c7e5721",
  "e96fb86f-4bf6-4f97-b7f3-ec4f2e960788",
  "95f77270-6143-4522-b55e-a3ef8cc48e18",
  "9561ad5f-0eda-460b-ab12-41caa4e0a91e",
  "9c4194e4-adfb-4a35-a4ef-c8411459545b",
  "90f5542f-c3cf-4df2-a9b0-27a85606d659",
  "e777e4b4-25cb-4c39-98fc-8d6b25cf7de7",
  "90c74649-458d-4b5f-8f58-9ab77f03f4ad",
  "a4c12003-9638-473d-bfe3-dddf509c80b8",
  "a95f7916-24ee-4d7e-bc71-6f9f1e009f23",
  "a4bb497d-7e15-47c4-9787-374b013efbbe",
  "ffae5a99-c403-41aa-9985-0633aee4aeff",
  "f9cb9d4c-10ad-42e4-8997-dbc9e12bd55a",
  "e6a7fd91-8669-4c27-a8d8-8a6941b62759",
  "f865d9bf-0062-4d43-9c16-2a862d8af4f0",
  "e5f14a79-fe4c-450e-b81e-21d8c9e1ea9b",
  "c75873dc-16d0-4e9c-b5b5-1c6ede0b0b63",
  "c6022d8a-69df-45be-aadd-ec39a18a18fb",
  "e438c68c-c1e4-4fc1-9d1e-28cab8acb42a",
  "e179ded3-4cdc-4110-ac9c-f12c20f9ccad",
  "d7910856-9d2c-4142-b8cc-cbd6c4b3acac",
  "dd6b80d0-dad3-42a3-8b70-7cc963105027",
  "e73b2210-e5e7-42c0-a48f-5ce07b28da43",
  "f6ca5824-45da-48a9-8268-2725eed58b79",
  "e5f322e7-e38c-4a3c-9b1b-8df2cb459884",
  "fde1748c-7c0f-4df8-8acd-120df29a9305",
  "f3d82b25-6b10-44c7-ae89-30df075a7ac8",
  "ea36992f-a3bf-4cce-8942-05ff04e2ae5f",
  "f2fbddd2-a5bb-45fe-93ef-2a9b9940bbd5",
  "f3d14ce1-8df5-4c5c-88b8-f17f56077e04",
  "f2a7f677-64db-4dd9-9810-82e4910c7799",
  "83bf2591-579d-415b-a0d4-fe39868b46d1",
  "f4d2c0f5-0148-45e7-95ba-a5185d8e8060",
  "f5c6fd9c-8e5b-4c3c-8c3e-31233678f15b",
  "fa287d30-44a9-48ef-90d6-5ab0a54eab15",
  "f4e822f7-d2a2-4146-851c-04b2fa6d5265",
  "f78c30e5-2a4d-4a71-b5d4-482ba70d585f",
  "b6369867-aa5f-4df3-8af3-dcac2eb0dfc8",
  "f2964d50-042c-4021-8b52-992c08c6ff6f",
  "f664cb82-a0fc-467e-9a6a-ca34c89cc63c",
]);

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Wait for all web fonts to finish rendering — more reliable than networkidle alone. */
async function waitForFonts(page) {
  await page.evaluate(() => document.fonts.ready);
}

/**
 * Read the current camera ID from the ambient player's image src.
 * cameraImageUrl() produces URLs containing the camera UUID.
 */
async function currentCameraId(page) {
  return page.evaluate(() => {
    const imgs = document.querySelectorAll("img");
    for (const img of imgs) {
      const m = img.src.match(/cameras\/([0-9a-f-]{36})\//i);
      if (m) return m[1];
    }
    return null;
  });
}

/**
 * Skip cameras using ArrowRight until we land on one from CURATED_IDS.
 * Gives up after maxSkips and accepts whatever is showing.
 */
async function skipToCurated(page, curatedIds, maxSkips = 40) {
  for (let i = 0; i < maxSkips; i++) {
    const id = await currentCameraId(page);
    if (id && curatedIds.has(id)) {
      console.log(`   ✓ On curated camera: ${id.slice(0, 8)}`);
      return;
    }
    await page.keyboard.press("ArrowRight");
    await wait(2500);
  }
  console.log("   ⚠ Curated camera not found — capturing whatever is showing");
}

/**
 * Capture frames as lossless 2x PNGs from a live page and encode with gifski.
 * No video middleman — what you see is what gifski gets.
 */
async function captureGif(
  page,
  outputPath,
  { fps = 12, duration = 12, width = 800, quality = 75, lossy = 70 } = {}
) {
  const framesDir = join(TEMP, `frames-${Date.now()}`);
  mkdirSync(framesDir, { recursive: true });

  const totalFrames = fps * duration;
  const intervalMs = Math.round(1000 / fps);

  for (let i = 0; i < totalFrames; i++) {
    const framePath = join(framesDir, `frame${String(i).padStart(4, "0")}.png`);
    await page.screenshot({ path: framePath });
    await wait(intervalMs);
  }

  execSync(
    `gifski --fps ${fps} --width ${width} --quality ${quality} --lossy-quality ${lossy} --output "${outputPath}" "${framesDir}/frame"*.png`,
    { stdio: "pipe" }
  );

  rmSync(framesDir, { recursive: true, force: true });
}

async function newPage(browser, width, height, scale = 2) {
  const context = await browser.newContext({ deviceScaleFactor: scale });
  const page = await context.newPage();
  await page.setViewportSize({ width, height });
  await page.addStyleTag({ content: "[data-sonner-toaster]{display:none!important}" });
  return page;
}

const browser = await chromium.launch();

// ── Ambient desktop GIF: hover reveals controls → click Info → close ─────────
// 1x scale + narrow width keeps file size small (~4-6MB vs 36MB at 2x/1440px).
console.log("🎨  Capturing ambient desktop GIF...");
{
  const page = await newPage(browser, 1280, 800, 1);

  await page.goto(`${BASE_URL}/ambient`, { waitUntil: "networkidle" });
  await waitForFonts(page);
  await wait(2000);
  await page.getByRole("button", { name: "Start ambient mode" }).click();
  await wait(6000); // feed loaded, controls auto-hidden after 4s idle

  // Capture 9s: clean feed → hover reveals controls → click Info → overlay → close
  console.log("   → Capturing 9s (hover controls → Info → close)...");
  const gifCapture = captureGif(page, gifPath("ambient"), {
    fps: 6,
    duration: 9,
    width: 720,
  });

  await wait(1500); // clean fullscreen feed
  await page.mouse.move(640, 600); // nudge mouse → onMouseMove → controls fade in
  await wait(1200); // controls transition settles (~200ms) + brief dwell
  await page.getByRole("button", { name: "Show location info" }).click();
  await wait(3800); // info overlay visible
  await page.keyboard.press("Escape"); // close overlay
  await wait(2500); // overlay fades, back to clean feed

  await gifCapture;
  await page.close();
  console.log(`   ✓ gifs/ambient-${TOD}.gif`);
}

// ── Explore map GIF: hover camera → click → panel slides in → close ──────────
// 1x scale fixes font rendering (2x→gifski downscale was blurring text).
console.log("🗺️   Capturing explore map GIF...");
{
  const page = await newPage(browser, 1440, 900, 1);

  await page.goto(`${BASE_URL}/explore`, { waitUntil: "networkidle" });
  await waitForFonts(page);
  await wait(6000); // map tiles, markers, camera list, and fonts all settled

  // First camera button in the inline desktop browse panel
  const cameraBtn = page.locator("ul button[aria-pressed]").first();

  // Capture 9s: map visible → hover camera → click → panel in → close
  console.log("   → Capturing 9s (hover → click camera → panel → close)...");
  const gifCapture = captureGif(page, gifPath("explore"), {
    fps: 6,
    duration: 9,
    width: 800,
  });

  await wait(1200); // map + list visible
  await cameraBtn.hover(); // highlight camera row
  await wait(1000); // hover state visible
  await cameraBtn.click(); // camera panel slides in from right
  await wait(4000); // panel animates in, feed image loads, lore visible
  await page.keyboard.press("Escape"); // close panel
  await wait(2800); // panel slides out

  await gifCapture;
  await page.close();
  console.log(`   ✓ gifs/explore-${TOD}.gif`);
}

// ── Photobooth GIF: Broadway @ 42 St, Polaroid shot, full countdown → result ─
console.log("📷   Capturing photobooth GIF...");
{
  const page = await newPage(browser, 1440, 900);
  // Broadway @ 42 St — reliable online camera in a recognisable location
  const PHOTOBOOTH_CAMERA = "9565e94d-66f2-4965-9c13-82d5500d6cfd";

  // Navigate once to establish the origin so localStorage is accessible, then
  // set the preflight agreement key and reload — this skips the terms/tips screen
  // and renders PhotoboothClient directly on the second load.
  await page.goto(`${BASE_URL}/photobooth/${PHOTOBOOTH_CAMERA}`, {
    waitUntil: "networkidle",
  });
  await page.evaluate(() => localStorage.setItem("nycgrid-photobooth-agreed", "1"));
  await page.reload({ waitUntil: "networkidle" });
  await waitForFonts(page);
  await wait(3000); // live feed image settles

  // Select Polaroid (1 shot) — keeps the GIF tight while still showing the full flow.
  // Use locator with hasText rather than getByRole — the button contains an SVG icon
  // which can interfere with accessible name resolution.
  await page.locator("button", { hasText: "Polaroid" }).click();
  await wait(500);

  // Capture 13s: 3s countdown + ~1s fetch + compose + ~4s result dwell
  console.log("   → Capturing 13s (Polaroid: countdown → flash → result)...");
  const gifCapture = captureGif(page, gifPath("photobooth"), {
    fps: 8,
    duration: 13,
    width: 900,
  });

  await page.locator("button", { hasText: "Shoot" }).click();
  await wait(11000); // countdown (3s) + fetch + compose + result dwell

  await gifCapture;
  await page.close();
  console.log(`   ✓ gifs/photobooth-${TOD}.gif`);
}

// ── Walkthrough GIF: home → explore → hover camera → panel opens ──────────────
console.log("🎬   Capturing walkthrough GIF...");
{
  const page = await newPage(browser, 1440, 900, 1);

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await waitForFonts(page);
  await wait(3000); // hero + spotlight image settle

  // Capture 12s: home (2s) → click Explore → map loads → hover + click camera → panel
  console.log("   → Capturing 12s (home → explore → camera panel)...");
  const gifCapture = captureGif(page, gifPath("walkthrough"), {
    fps: 6,
    duration: 12,
    width: 800,
  });

  await wait(2000); // dwell on home hero
  await page.getByRole("link", { name: /Explore the map/i }).first().click();
  await waitForFonts(page);
  await wait(4500); // map tiles, markers, camera list all settle

  // Hover then click the first camera in the list → panel slides in
  const cameraBtn = page.locator("ul button[aria-pressed]").first();
  await cameraBtn.hover();
  await wait(800);
  await cameraBtn.click();
  await wait(4200); // panel animates in, feed image loads

  await gifCapture;
  await page.close();
  console.log(`   ✓ gifs/walkthrough-${TOD}.gif`);
}

// ── Ambient mobile GIF: iPhone 16 — tap shows controls → Info → close ────────
console.log("📱   Capturing ambient mobile GIF...");
{
  const page = await newPage(browser, 390, 844, 1);

  await page.goto(`${BASE_URL}/ambient`, { waitUntil: "networkidle" });
  await waitForFonts(page);
  await wait(2000);
  await page.getByRole("button", { name: "Start ambient mode" }).click();
  await wait(6000); // feed loaded, controls auto-hidden after 4s idle

  // Capture 9s: clean feed → tap reveals controls → tap Info → overlay → close
  console.log("   → Capturing 9s (tap controls → Info → close)...");
  const gifCapture = captureGif(page, gifPath("ambient-mobile"), {
    fps: 6,
    duration: 9,
    width: 390,
  });

  await wait(1500); // clean fullscreen feed
  // Tap lower-center — triggers onMouseMove/click → controls reveal
  await page.mouse.click(195, 650);
  await wait(1200); // controls fade in + brief dwell
  await page.getByRole("button", { name: "Show location info" }).click();
  await wait(3800); // info overlay visible
  await page.keyboard.press("Escape");
  await wait(2500); // overlay fades

  await gifCapture;
  await page.close();
  console.log(`   ✓ gifs/ambient-mobile-${TOD}.gif`);
}

// Clean up temp frame directory
rmSync(TEMP, { recursive: true, force: true });

await browser.close();

console.log(`\n✅  GIFs saved to scripts/screenshots/gifs/${RUN_TS}/`);
console.log(`   ambient-${TOD}.gif        — hover controls → Info → close, 9s, 720px`);
console.log(`   explore-${TOD}.gif        — hover → click camera → panel → close, 9s, 800px`);
console.log(`   photobooth-${TOD}.gif     — Broadway @ 42 St, polaroid, 13s, 900px`);
console.log(`   walkthrough-${TOD}.gif    — home → explore → camera panel, 12s, 800px`);
console.log(`   ambient-mobile-${TOD}.gif — iPhone 16, tap controls → Info → close, 9s, 390px`);
console.log("\n💡  For best results:");
console.log("   Day footage (bright cameras):  run before 4pm ET");
console.log("   Night footage (atmospheric):   run after 8pm ET");

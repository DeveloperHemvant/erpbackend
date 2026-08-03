const bcrypt = require('bcrypt');
async function main() {
  console.log(await bcrypt.compare('Admin@123', '$2b$10$Cyi8Vft/3MCUtTF7Oy1d7Ohua1u/To3u9zxbBq0M89NMMSQfCLaK.'));
}
main();

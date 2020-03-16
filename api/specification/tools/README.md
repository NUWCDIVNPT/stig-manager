## Tooling for Swagger code generation
This directory contains the JAR file for version 2.4.0 of the ```swagger-codegen-cli```. A Windows batch file and Linux shell script are supplied which invoke the code generator with the [CMSAT API](../CMSAT.yaml) as input.

In Windows, run
```
generate.bat
```
In Linux, run
```
generate.sh
```

The generator uses .mustache templates in [nodejs](nodejs) to generate NodeJS source code into ```../../service```. The generator will NOT overwite any existing files that are present there.

### When to run the generator script
During API development, the generator should be run whenever the API specification is modified. The code generator produces the file ```api/swagger.yaml```, which is an expanded representation of the input document. This expanded API specification is used by the NodeJS implementation to perform validation. You should delete [swagger.yaml](../../service/api/swagger.yaml) from the API service prior to running the generator so it will be replaced. 
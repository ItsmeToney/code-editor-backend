// const { exec } = require("child_process");
// const fs = require("fs");

// // Main function to execute code
// const codeExecution = async (req, res) => {
//   const { functionCode, language, testCases } = req.body;
//   console.log("Received Request:", req.body);

//   try {
//     // Generate the full program with predefined function
//     const fullCode = wrapFunction(language, functionCode, testCases);
//     console.log("Full code:", fullCode);

//     const { fileName, compileCommand, runCommand } =
//       getLanguageConfig(language);
//     console.log(fileName, compileCommand, runCommand);
//     // Write the full code to a temporary file

//     fs.writeFileSync(fileName, fullCode);

//     //Checking if the file is created or not
//     if (!fs.existsSync(fileName)) {
//       console.error(`Error: ${fileName} was not created.`);
//       return res.status(500).json({ error: `${fileName} was not created.` });
//     } else {
//       console.log(`${fileName} exists.`);
//     }

//     //checking if the compiler exists
//     execPromise("gcc --version").catch(console.error); // For C
//     execPromise("javac -version").catch(console.error); // For Java
//     execPromise("python --version").catch(console.error); // For Python

//     // Compile if necessary
//     if (compileCommand) {
//       await execPromise(compileCommand);
//       console.log("Compiled successfully");
//     }

//     // Execute test cases
//     const testResults = await runTestCases(runCommand, testCases);

//     // Cleanup temp files
//     cleanupTempFiles(language);

//     console.log("Execution Results:", testResults);
//     res.json({ results: testResults });
//   } catch (error) {
//     cleanupTempFiles(language);
//     res.status(500).json({ error: error.message });
//   }
// };

// // **1. Wrap the user's function inside a complete program**
// const wrapFunction = (language, functionCode, testCases) => {
//   console.log(testCases.map((tc) => tc.input));
//   let wrappedCode;

//   if (language === "C") {
//     wrappedCode = `#include <stdio.h>

// ${functionCode}

// int main() {
// ${testCases
//   .map(
//     (test, index) => `    int result${index} = solution(${test.input.join(
//       ", "
//     )});
//     printf("%d\\n", result${index});`
//   )
//   .join("\n")}
//     return 0;
// }`;
//   } else if (language === "Java") {
//     wrappedCode = `${functionCode}
//     public class Main {
//     public static void main(String[] args) {
//     ${testCases
//       .map(
//         (test) =>
//           `  System.out.println(new Solution().solution(${
//             typeof test.input === "string"
//               ? `"${test.input}"` // Single string case -> solution("string")
//               : Array.isArray(test.input)
//               ? test.input.length === 1 && typeof test.input[0] === "string"
//                 ? `"${test.input[0]}"` // ["string"] should become solution("string")
//                 : Array.isArray(test.input[0])
//                 ? typeof test.input[0][0] === "string"
//                   ? `new String[]{${test.input[0]
//                       .map((str) => `"${str}"`)
//                       .join(", ")}}`
//                   : `new int[]{${test.input[0].join(", ")}}`
//                 : test.input.join(", ")
//               : test.input
//           }));`
//       )
//       .join(" ")}
// }}`;
//   } else if (language === "Python") {
//     wrappedCode = `${functionCode}

// if __name__ == "__main__":
// ${testCases
//   .map(
//     (test, index) => `    print("Test ${index + 1}:", solution(${test.input}))`
//   )
//   .join("\n")}`;
//   } else {
//     throw new Error("Unsupported language");
//   }

//   return wrappedCode;
// };

// // **2. Define language-specific configurations**
// const getLanguageConfig = (language) => {
//   let fileName, compileCommand, runCommand;

//   if (language === "C") {
//     fileName = "Main.c";
//     compileCommand = "gcc Main.c -o Main.exe"; // Compilation command
//     runCommand = "Main.exe"; // Execution command
//   } else if (language === "Java") {
//     fileName = "Main.java";
//     compileCommand = "javac Main.java";
//     runCommand = "java Main";
//   } else if (language === "Python") {
//     fileName = "Main.py";
//     compileCommand = null; // No compilation needed
//     runCommand = "python Main.py";
//   } else {
//     throw new Error("Unsupported language");
//   }

//   return { fileName, compileCommand, runCommand };
// };

// // **3. Execute code for all test cases**
// const runTestCases = async (runCommand, testCases) => {
//   let testResults = [];

//   const resOutput = await execPromise(runCommand);

//   // console.log(resOutput.trim().split("\n"));
//   const outputArray = resOutput.trim().split("\n");
//   console.log(outputArray);

//   for (let i = 0; i < testCases.length; i++) {
//     const { input, output } = testCases[i];
//     console.log("Inside runTestCases function", input, output);

//     // const resOutput = await execPromiseWithInput(runCommand, input);

//     // Compare actual output with expected output
//     const isPassed =
//       outputArray[i].replace("\r", "") === output.toString().trim();

//     testResults.push({
//       testCase: i + 1,
//       input,
//       expectedOutput: output,
//       actualOutput: outputArray[i].replace("\r", ""),
//       passed: isPassed,
//     });
//   }

//   return testResults;
// };

// // **4. Helper function to execute commands**
// const execPromise = (command) => {
//   return new Promise((resolve, reject) => {
//     console.log(`Executing command: ${command}`);
//     exec(command, (error, stdout, stderr) => {
//       if (error) {
//         console.error(`Execution error: ${error.message}`);
//         console.error(`stderr: ${stderr}`);
//         reject(stderr || error.message);
//       } else {
//         console.log(`stdout: ${stdout}`);
//         resolve(stdout);
//       }
//     });
//   });
// };

// // **5. Helper function to execute a command with input**
// const execPromiseWithInput = (command, input) => {
//   return new Promise((resolve, reject) => {
//     console.log(`Executing: ${command}`);
//     console.log(`Input:`, input);
//     const process = exec(command, (error, stdout, stderr) => {
//       if (error) reject(stderr || error.message);
//       else resolve(stdout);
//     });

//     // Send input to the process
//     if (process.stdin) {
//       const formattedInput = Array.isArray(input) ? input.join("\n") : input;
//       process.stdin.write(formattedInput + "\n");
//       process.stdin.end();
//     }
//   });
// };

// // **6. Cleanup function to remove temp files**
// const cleanupTempFiles = (language) => {
//   try {
//     fs.unlinkSync(
//       `Main.${language === "C" ? "c" : language === "Java" ? "java" : "py"}`
//     );
//     if (language === "C") {
//       fs.unlinkSync("Main.exe"); // Remove compiled C binary
//     }
//     if (language === "Java") {
//       if (fs.existsSync("Solution.class")) {
//         fs.unlinkSync("Solution.class");
//       }
//       if (fs.existsSync("Main.class")) {
//         fs.unlinkSync("Main.class");
//       }
//     } // Remove compiled Java class
//   } catch (err) {
//     console.error("Cleanup Error:", err.message);
//   }
// };

// module.exports = codeExecution;

const { executeCode, LANGUAGES } = require("../services/judge0Service.js");

const codeExecution = async function (req, res) {
  try {
    const { functionCode, language, testCases } = req.body;

    if (!functionCode || !language) {
      return res.status(400).json({ error: "Code and language are required" });
    }

    if (!LANGUAGES[language.toLowerCase()]) {
      return res.status(400).json({ error: "Unsupported language" });
    }

    const result = await executeCode(language, functionCode, testCases);
    res.json(result);
  } catch (error) {
    console.error("Execution error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { codeExecution };

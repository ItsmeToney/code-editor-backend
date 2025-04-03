const axios = require("axios");
require("dotenv").config(); // Load environment variables

const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com";
// const RAPIDAPI_KEY = "c5740a788cmsh039e0e670e7f410p14a705jsn995181c98c05"; // Get from RapidAPI dashboard
const RAPIDAPI_KEY = "22f9185429msh164dd57199ca166p1d38e8jsn3a8ab2f52133"; // Get from RapidAPI dashboard
const RAPIDAPI_HOST = "judge0-ce.p.rapidapi.com";

const headers = {
  "X-RapidAPI-Key": RAPIDAPI_KEY,
  "X-RapidAPI-Host": RAPIDAPI_HOST,
  "Content-Type": "application/json",
};

const LANGUAGES = {
  c: 50,
  java: 62,
  python: 71,
  javascript: 63,
};

const CODE_TEMPLATES = {
  python: (funcCode, testCases) => `

import json
import inspect

${funcCode}

def run_tests():
    # Convert JSON test cases safely from JavaScript to Python format
    test_cases = json.loads('''${JSON.stringify(testCases)}''') 

    results = []

    # Detect function parameters dynamically
    func_params = inspect.signature(solution).parameters
    num_params = len(func_params)

    for tc in test_cases:
        input_vals = tc["input"]
        expected_output = tc["output"]

        # Ensure input is passed correctly to the function
        if isinstance(input_vals, list) and num_params == 1:
            input_vals = (input_vals[0],)  # Convert single-list input into a tuple
        elif not isinstance(input_vals, tuple):
            input_vals = (input_vals,)  # Wrap single arguments in a tuple

        try:
            actual_output = solution(*input_vals)
            status = "success" if actual_output == expected_output else "fail"
        except Exception as e:
            actual_output = str(e)
            status = "fail"

        results.append({
            "input": tc["input"],
            "expectedOutput": expected_output,
            "actualOutput": actual_output,
            "status": status
        })

    print(json.dumps(results, indent=2))

run_tests()
`,
  c: (funcCode, testCases) => `
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

// User-defined function
${funcCode}

int main() {
    printf("[");
    
    int numTests = ${testCases.length};
    
    for (int i = 0; i < numTests; i++) {
        // ✅ Declare input variable dynamically based on test case type
        ${testCases
          .map((tc, index) => {
            let inputVar = "";
            let expectedOutputVar = "";
            let functionCall = "";

            if (typeof tc.input === "number") {
              inputVar = `int input = ${tc.input};`;
              expectedOutputVar = `int expectedOutput = ${tc.expected_output};`;
              functionCall = `int actualOutput = userFunction(input);`;
            } else if (typeof tc.input === "string") {
              inputVar = `char input[] = "${tc.input.replace(/"/g, '\\"')}";`;
              expectedOutputVar = `char expectedOutput[] = "${tc.expected_output.replace(
                /"/g,
                '\\"'
              )}";`;
              functionCall = `char actualOutput[100]; userFunction(input, actualOutput);`;
            } else if (Array.isArray(tc.input)) {
              if (typeof tc.input[0] === "number") {
                inputVar = `int input[] = {${tc.input.join(
                  ", "
                )}}; int size = ${tc.input.length};`;
                expectedOutputVar = `int expectedOutput[] = {${tc.expected_output.join(
                  ", "
                )}};`;
                functionCall = `int actualOutput[${tc.expected_output.length}]; userFunction(input, size, actualOutput);`;
              } else if (typeof tc.input[0] === "string") {
                inputVar = `char *input[] = {${tc.input
                  .map((s) => `"${s}"`)
                  .join(", ")}}; int size = ${tc.input.length};`;
                expectedOutputVar = `char *expectedOutput[] = {${tc.expected_output
                  .map((s) => `"${s}"`)
                  .join(", ")}};`;
                functionCall = `char *actualOutput[${tc.expected_output.length}]; userFunction(input, size, actualOutput);`;
              }
            }

            return `
        // Test Case ${index + 1}
        ${inputVar}
        ${expectedOutputVar}
        ${functionCall}
        printf("{\\"input\\": \\"%s\\", \\"expectedOutput\\": \\"%s\\", \\"actualOutput\\": \\"%s\\", \\"status\\": \\"%s\\"}", 
            "${JSON.stringify(tc.input)}", 
            "${JSON.stringify(tc.expected_output)}", 
            "${JSON.stringify(tc.expected_output)}", 
            (memcmp(actualOutput, expectedOutput, sizeof(actualOutput)) == 0) ? "success" : "fail");`;
          })
          .join("\n")}
        
        if (i < numTests - 1) printf(",");
    }
    
    printf("]");
    return 0;
}
`,
  java: (funcCode, testCases) => `
  import java.util.*;
  
  ${funcCode}  // User-defined function

  public class Main {
      public static void main(String[] args) {
          List<Map<String, Object>> results = new ArrayList<>();
          
          // ✅ Fix: Properly format test cases
          Object[][] testCases = {${testCases
            .map((tc) => `{"${tc.input}", "${tc.expected_output}"}`)
            .join(", ")}};

          for (Object[] testCase : testCases) {
              String input = (String) testCase[0];
              String expectedOutput = (String) testCase[1];
              String actualOutput = Solution.solution(input);

              Map<String, Object> result = new HashMap<>();
              result.put("input", input);
              result.put("expectedOutput", expectedOutput);
              result.put("actualOutput", actualOutput);
              result.put("status", actualOutput.equals(expectedOutput) ? "success" : "fail");

              results.add(result);
          }

          System.out.println(results);
      }
  }
  `,
};

async function executeCode(language, functionCode, testCases) {
  try {
    if (!LANGUAGES[language]) {
      throw new Error("Unsupported language");
    }

    const languageId = LANGUAGES[language];
    const wrappedCode = CODE_TEMPLATES[language](functionCode, testCases);

    console.log("Executing Code:", wrappedCode);

    const submissionResponse = await axios.post(
      `${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
      { source_code: wrappedCode, language_id: languageId, stdin: "" },
      { headers }
    );

    const { token } = submissionResponse.data;
    const resultResponse = await checkSubmission(token);

    if (resultResponse.stdout) {
      return JSON.parse(resultResponse.stdout);
    } else {
      throw new Error("Execution failed: " + resultResponse.stderr);
    }
  } catch (error) {
    console.error("Judge0 API error:", error.response?.data || error.message);
    throw new Error("Failed to execute code");
  }
}

async function checkSubmission(token) {
  try {
    const response = await axios.get(
      `${JUDGE0_API_URL}/submissions/${token}?base64_encoded=false`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Judge0 API error:", error.response?.data || error.message);
    throw new Error("Failed to check submission status");
  }
}

module.exports = { executeCode, checkSubmission, LANGUAGES };

const axios = require("axios");
require("dotenv").config(); // Load environment variables

const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com";
const RAPIDAPI_KEY = "c5740a788cmsh039e0e670e7f410p14a705jsn995181c98c05"; // Get from RapidAPI dashboard
// const RAPIDAPI_KEY = "22f9185429msh164dd57199ca166p1d38e8jsn3a8ab2f52133"; // Get from RapidAPI dashboard
// const RAPIDAPI_KEY = "a668c53752mshd8cbbe6bf6fa5f4p101312jsndf440354d409"; // Get from RapidAPI dashboard
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
  `,

  java: (funcCode, testCases) => `import java.util.*;
import java.lang.reflect.*;
import java.util.Arrays;

${funcCode} // The user's function is injected here

class TestResult {
    String input;
    String expectedOutput;
    String actualOutput;
    String status;

    public TestResult(String input, String expectedOutput, String actualOutput, String status) {
        this.input = input;
        this.expectedOutput = expectedOutput;
        this.actualOutput = actualOutput;
        this.status = status;
    }

    @Override
    public String toString() {
        return "{ \"input\": \"" + input + "\", \"expectedOutput\": \"" + expectedOutput +
                "\", \"actualOutput\": \"" + actualOutput + "\", \"status\": \"" + status + "\" }";
    }
}

public class Main {
    public static void main(String[] args) {
        List<TestResult> results = new ArrayList<>();
        Solution solution = new Solution();
        
        try {
            Method method = Solution.class.getDeclaredMethods()[0]; // Gets the first method in Solution class
            Class<?>[] paramTypes = method.getParameterTypes(); // Gets parameter types

            // Manually add test cases (since we removed convertToJavaSyntax)
            Object[][] testCases = new Object[][] {
                { new int[]{7,1,5,3,6,4}, 5 }, 
                { new int[]{7,6,4,3,1}, 0 }
            };

            for (Object[] testCase : testCases) {
                Object input = testCase[0];
                Object expectedOutput = testCase[1];

                Object actualOutput = method.invoke(solution, input);

                boolean isCorrect = compareOutputs(expectedOutput, actualOutput);

                String status = isCorrect ? "success" : "fail";
                results.add(new TestResult(Arrays.deepToString(new Object[]{input}), 
                                           String.valueOf(expectedOutput), 
                                           String.valueOf(actualOutput), 
                                           status));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        // Print results in JSON format
        System.out.println("[");
        for (int i = 0; i < results.size(); i++) {
            System.out.print("  " + results.get(i));
            if (i < results.size() - 1) {
                System.out.println(",");
            }
        }
        System.out.println("\n]");
    }

    private static boolean compareOutputs(Object expected, Object actual) {
        if (expected instanceof int[] && actual instanceof int[]) {
            return Arrays.equals((int[]) expected, (int[]) actual);
        } else if (expected instanceof double[] && actual instanceof double[]) {
            return Arrays.equals((double[]) expected, (double[]) actual);
        } else if (expected instanceof boolean[] && actual instanceof boolean[]) {
            return Arrays.equals((boolean[]) expected, (boolean[]) actual);
        } else if (expected instanceof String[] && actual instanceof String[]) {
            return Arrays.equals((String[]) expected, (String[]) actual);
        } else if (expected instanceof int[][] && actual instanceof int[][]) {
            return Arrays.deepEquals((int[][]) expected, (int[][]) actual);
        } else if (expected instanceof Object[] && actual instanceof Object[]) {
            return Arrays.deepEquals((Object[]) expected, (Object[]) actual);
        } else {
            return Objects.equals(expected, actual);
        }
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

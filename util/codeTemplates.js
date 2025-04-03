const CODE_TEMPLATES = {
  python: (funcCode, testCases) => `
  import json
  ${funcCode}  # User-defined function
  
  # Test Cases
  results = []
  ${testCases
    .map(
      (tc) => `results.append({
      "input": ${tc.input},
      "expectedOutput": ${tc.expected_output},
      "actualOutput": my_function(${tc.input})
  })`
    )
    .join("\n")}
  
  print(json.dumps(results))
  `,

  javascript: (funcCode, testCases) => `
  ${funcCode}  // User-defined function
  
  const results = [];
  ${testCases
    .map(
      (tc) => `
  results.push({
    input: ${tc.input},
    expectedOutput: ${tc.expected_output},
    actualOutput: myFunction(${tc.input})
  });`
    )
    .join("\n")}
  
  console.log(JSON.stringify(results));
  `,

  java: (funcCode, testCases) => `
  import org.json.JSONArray;
  import org.json.JSONObject;
  
  public class Main {
    ${funcCode}  // User-defined function
  
    public static void main(String[] args) {
      JSONArray results = new JSONArray();
      ${testCases
        .map(
          (tc) => `
      JSONObject result = new JSONObject();
      result.put("input", ${tc.input});
      result.put("expectedOutput", ${tc.expected_output});
      result.put("actualOutput", myFunction(${tc.input}));
      results.put(result);
      `
        )
        .join("\n")}
      
      System.out.println(results.toString());
    }
  }
  `,

  c: (funcCode, testCases) => `
  #include <stdio.h>
  #include <stdlib.h>
  
  // User-defined function
  ${funcCode}
  
  // Main function to test user code
  int main() {
    printf("[");
    ${testCases
      .map(
        (tc, index, array) => `
    printf("{\\"input\\": %d, \\"expectedOutput\\": %d, \\"actualOutput\\": %d}",
           ${tc.input}, ${tc.expected_output}, myFunction(${tc.input}));
    ${index < array.length - 1 ? 'printf(", ");' : ""}
  `
      )
      .join("\n")}
    printf("]");
    return 0;
  }
  `,
};

module.exports = { CODE_TEMPLATES };

const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com";
const RAPIDAPI_KEY = "c5740a788cmsh039e0e670e7f410p14a705jsn995181c98c05"; // Get from RapidAPI dashboard
const RAPIDAPI_HOST = "judge0-ce.p.rapidapi.com";

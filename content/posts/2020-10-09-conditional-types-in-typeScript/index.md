---
title: Typescript中的条件类型
slug: conditional-types-in-typescript
cover: ./cover2.png
generate-card: false
date: 2020-10-09
language: zh_cn
tags: ['typescript']
---
Typescript在2.8版本新增了条件类型，一个对于类型系统来说非常强大和令开发者激动人心的特性。条件类型可以让我们描述不一致的映射类型，也就是说，它是一种取决于条件的类型转换。光是看概念可能会有点晦涩和抽象，下面我们来具体介绍语法并且看一些实际的例子。

### 概述
条件类型描述一种类型关系的测试并且选择两种可能的类型中的一种，它取决于条件测试的结果。它一般有如下的形式：
```typescript
T extends U ? X : Y
```
条件类型使用与 `...?...:...` 类似的语法，这种语法跟 `Javascript` 里面的三元运算符相似，这里的 `T`、`U`、`X`、`Y` 表示任意的类型。`T extends U` 部分描述类型关系的测试，如果这个条件满足，类型 `X` 会被选中，否则类型 `Y` 会被选中。

用人类的语言描述，这里的条件类型可以解读成如下的意思：如果类型 `T` 能够满足类型 `U`，则选择类型 `X`，否则选择类型 `Y`。

下面是一个预定义在 `Typescript` 中的 `lib.es5.d.ts` 文件里的一个条件类型的例子：
```typescript
/**
 * Exclude null and undefined from T
 */
type NonNullable<T> = T extends null | undefined ? never : T;
```
如果 `T` 能够满足类型 `null` 或者 `undefined`，`NonNullable` 类型会选中 `never` 类型，否则保持类型 `T`。`never` 类型是 `Typescript` 中的底层类型，指的是没有出现值的一种类型。

### 分布的条件类型
那么为什么结合条件类型和 `never` 类型有用了？它能够有效地让我们从联合类型中移除部分的类型。如果条件类型中的关系测试检查裸露的类型参数，这时候条件类型就被称为分布的条件类型。当联合类型实例化时，它分布在联合类型上。

当 `NonNullable<T>` 检查一个裸露的类型参数，它分布在联合类型 `A | B` 上，这里指的是 `NonNullable<A | B>` 被解析为 `NonNullable<A> | NonNullable<B>`。例如，如果 `NonNullable<A>` 解析成 `never` 类型，我们可以能够将 `A` 从联合类型中移除，因为它的空值性质，可以有效地过滤掉 `A` 。对于 `NonNullable<B>` 效果也是一样的。

上面的描述很抽象，让我们看一个具体的例子。我们先定义一个 `EmailAddress` 类型别名，它代表着四种类型，包括 `undefined` 和 `null` 单个类型：
```typescript
type EmailAddress = string | string[] | null | undefined;
```
现在，我们将 `NonNullable<T>` 应用到 `EmailAddress` 上并且一步一步解析结果：
```typescript
type NonNullableEmailAddress = NonNullable<EmailAddress>;
```
接下来，我们开始使用联合类型替换 `EmailAddress`：
```typescript
type NonNullableEmailAddress = NonNullable<
  | string
  | string[]
  | null
  | undefined
>;
```
这里就是分布原始的条件类型开始起作用的地方，我们正在将 `NonNullable<T>` 应用在此联合类型上，这里相当于应用条件类型在联合类型上的单个类型上：
```typescript
type NonNullableEmailAddress =
  | NonNullable<string>
  | NonNullable<string[]>
  | NonNullable<null>
  | NonNullable<undefined>;
```
我们能够替换 `NonNullable<T>` 在任何地方：
```typescript
type NonNullableEmailAddress =
  | (string extends null | undefined ? never : string)
  | (string[] extends null | undefined ? never : string[])
  | (null extends null | undefined ? never : null)
  | (undefined extends null | undefined ? never : undefined);
```
接下来，我们将解析四个条件类型中的每一个，无论是 `string` 还是 `string[]` 都不能满足 `null` 或者 `undefined`，这就是为什么前两种类型 `string` 和 `string[]` 选中的原因。`null` 和 `undefined` 都满足 `null` 或 `undefined`，这就是为什么后两种类型选中了 `never` 的原因：
```typescript
type NonNullableEmailAddress =
  | string
  | string[]
  | never
  | never;
```
因为 `never` 类型是任何类型的子类型，我们可以将它从联合类型中忽略，最终的结果就是：
```typescript
type NonNullableEmailAddress = string | string[];
```
这实际上就是我们最终所期望的类型。

### 条件类型的映射类型
让我们看一个更加复杂的例子，结合条件类型的映射类型。这里，我们定义了一个能够从其它类型中提取出非空值的属性的类型：
```typescript
type NonNullablePropertyKeys<T> = {
  [P in keyof T]: null extends T[P] ? never : P
}[keyof T];
```
这个类型第一眼看起看起来似乎有点晦涩。再一次，我将通过一个具体的例子，并且一步一步地解析结果，来揭开它神秘的面纱。

我们现在有一个 `User` 类型，并且想利用 `NonNullablePropertyKeys<T>` 找出哪些属性是非空值的：
```typescript
type User = {
  name: string;
  email: string | null;
};

type NonNullableUserPropertyKeys = NonNullablePropertyKeys<User>;
```
下面是我们如何解析 `NonNullablePropertyKeys<User>` 的过程。首先，我们提供 `User` 类型作为类型 `T` 的参数：
```typescript
type NonNullableUserPropertyKeys = {
  [P in keyof User]: null extends User[P] ? never : P
}[keyof User];
```
第二步，我们在映射类型中解析 `keyof User`。`User` 类型有两个属性：`name` 和 `email`，我们以 `name` 和 `email` 的字符串字面量联合类型结束：
```typescript
type NonNullableUserPropertyKeys = {
  [P in "name" | "email"]: null extends User[P] ? never : P
}[keyof User];
```  
接下来，我们展开 `P in … ` 映射并使用 `name` 和 `email` 替换：
```typescript
type NonNullableUserPropertyKeys = {
  name: null extends User["name"] ? never : "name";
  email: null extends User["email"] ? never : "email";
}[keyof User];
```
紧接着，我们通过查找 `User` 中的属性 `name` 和 `email` 的类型继续解析索引访问类型 `User["name"] and User["email"]`：
```typescript
type NonNullableUserPropertyKeys = {
  name: null extends string ? never : "name";
  email: null extends string | null ? never : "email";
}[keyof User];
```
到目前这一步，是时候应用我们的条件类型。`null` 不可能继承自 `string`，但是它能继承自 `string | null` ，我们因此以 `name` 和 `never` 类型结束，依次为：
```typescript
type NonNullableUserPropertyKeys = {
  name: "name";
  email: never;
}[keyof User];
```
当前我们既完成了映射类型也完成了条件类型，更进一步，我们需要解析 `keyof User`：
```typescript
type NonNullableUserPropertyKeys = {
  name: "name";
  email: never;
}["name" | "email"];
```
我们现在有一个可以查找 `name` 和 `email` 属性的类型的索引访问类型，`Typescript` 通过分别查找每个类型并且创建结果的联合类型来解析它：
```typescript
type NonNullableUserPropertyKeys =
  | { name: "name"; email: never }["name"]
  | { name: "name"; email: never }["email"];
```
直到这里，我们几乎快完成了！我们能够在两个对象类型中查找 `name` 和 `email` 属性，`name` 属性有 `name` 类型，`email` 属性为 `never` 类型：
```typescript
type NonNullableUserPropertyKeys =
  | "name"
  | never;
```
依然如前面的例子，我们可以清除 `never` 类型，简化联合类型的结果：
```typescript
type NonNullableUserPropertyKeys = "name";
```
这就是最后的结果了，在 `User` 类型中的唯一非空属性只有 `name`。

让我们更进一步看这个例子并且定义一个能提取所给类型的所有非空属性的类型，我们可以使用 `Pick<T, K>` 类型，它已经预先定义在 `lib.es5.d.ts`：
```typescript
/**
 * From T, pick a set of properties
 * whose keys are in the union K
 */
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};
``` 
我们结合之前的 `NonNullablePropertyKeys<T>` 类型和 `Pick<T, K>` 类型定义 `NonNullableProperties<T>`，这就是我们想要寻找的类型：
```typescript
type NonNullableProperties<T> = Pick<T, NonNullablePropertyKeys<T>>;

type NonNullableUserProperties = NonNullableProperties<User>;
// { name: string }
```
实际上，这里的类型就是我们期望的类型：在我们的 `User` 类型中，只有 `name` 属性是非空值的。

### 条件类型中的类型推断
条件类型支持的另一个有用特性是使用新的 `infer` 关键字推断类型变量，在条件类型的 `extends` 分句中，你可以使用新的 `infer` 关键词来推断变量类型，有效地执行类型匹配模式：
```typescript
type First<T> =
  T extends [infer U, ...unknown[]]
    ? U
    : never;

type SomeTupleType = [string, number, boolean];
type FirstElementType = First<SomeTupleType>; // string
```
注意，推断类型变量(在本例中为U)只能在条件类型为**真**的分支中使用。

有一个Typescript长期的功能需求就是能够提取出所给函数的返回类型，这里是一个简化版本的 `ReturnType<T>`，它被预先定义在 `lib.es5.d.ts` 中，它使用了 `infer` 关键字来推断函数的返回类型：
```typescript
type ReturnType<T> =
  T extends (...args: any[]) => infer R
    ? R
    : any;

type A = ReturnType<() => string>;         // string
type B = ReturnType<() => () => any[]>;    // () => any[]
type C = ReturnType<typeof Math.random>;   // number
type D = ReturnType<typeof Array.isArray>; // boolean
```
注意，我们必须使用 `typeof` 来获得 `Math.random()` 和 `Array.isArray()` 方法的返回类型，我们需要传递一个类型作为参数给类型参数 `T`，而不是一个值。这就是为什么 `ReturnType<Math.random>` 和 `ReturnType<Array.isArray>` 的用法是不对的。

想要了解更多的关于 `infer` 是怎么工作的信息，可以查看 [infer](https://github.com/Microsoft/TypeScript/pull/21496)，在这里，[Anders Hejlsberg](https://zh.wikipedia.org/wiki/%E5%AE%89%E5%BE%B7%E6%96%AF%C2%B7%E6%B5%B7%E5%B0%94%E6%96%AF%E4%BC%AF%E6%A0%BC) 介绍了条件类型中的类型推断。

### 预定义的条件类型
条件类型无疑是TypeScript类型系统的高级特性，为了再举一些例子说明它的用途，我想复习一些预定义在 `Typescript` 的 `lib.es5.d.ts` 文件中的条件类型。

#### NonNullable&lt;T&gt;
之前我们已经看过并且使用过 `NonNullable<T>`，它能够过滤掉 `T` 中的 `null` 和 `undefined` 类型。它的定义：
```typescript
/**
 * Exclude null and undefined from T
 */
type NonNullable<T> = T extends null | undefined ? never : T;
``` 
一些用例：
```typescript
type A = NonNullable<boolean>;            // boolean
type B = NonNullable<number | null>;      // number
type C = NonNullable<string | undefined>; // string
type D = NonNullable<null | undefined>;   // never
``` 

#### Extract&lt;T, U&gt;
`Extract<T, U>` 类型让我们过滤掉 `T` 类型中能够满足 `U` 类型中的那些类型，它的定义：
```typescript
/**
 * Extract from T those types that are assignable to U
 */
type Extract<T, U> = T extends U ? T : never;
```
一些用例：
```typescript
type A = Extract<string | string[], any[]>;      // string[]
type B = Extract<(() => void) | null, Function>; // () => void
type C = Extract<200 | 400, 200 | 201>;          // 200
type D = Extract<number, boolean>;               // never
```

#### Exclude&lt;T, U&gt;
`Exculde<T, U>` 类型让我们过滤掉 `T` 类型中不能满足 `U` 类型中的那些类型，它跟 `Extract<T, U>` 类型相对应。

它的定义：
```typescript
/**
 * Exclude from T those types that are assignable to U
 */
type Exclude<T, U> = T extends U ? never : T;
```
一些用例：
```typescript
type A = Exclude<string | string[], any[]>;      // string
type B = Exclude<(() => void) | null, Function>; // null
type C = Exclude<200 | 400, 200 | 201>;          // 400
type D = Exclude<number, boolean>;               // number
```

#### ReturnType&lt;T&gt; 
正如我们上面看过的，`ReturnType<T>` 让我们提取函数类型的返回类型。它的定义：
```typescript
/**
 * Obtain the return type of a function type
 */
type ReturnType<T extends (...args: any[]) => any> =
  T extends (...args: any[]) => infer R
    ? R
    : any;
```
一些用例：
```typescript
type A = ReturnType<() => string>;         // string
type B = ReturnType<() => () => any[]>;    // () => any[]
type C = ReturnType<typeof Math.random>;   // number
type D = ReturnType<typeof Array.isArray>; // boolean
```

#### Parameters&lt;T&gt;
`Parameters<T>` 类型让我们提取函数类型的参数类型，它会生成具有所有参数类型的 `tuple` 类型(或者如果T不是函数，则为never类型)。它的定义：
```typescript
/**
 * Obtain the parameters of a function type in a tuple
 */
type Parameters<T extends (...args: any[]) => any> =
  T extends (...args: infer P) => any
    ? P
    : never;
```
注意，`Parameters<T>` 类型与 `ReturnType<T>` 类型在结构上几乎相同，最主要的区别就是 `infer` 关键字的所在位置不同。一些用例：
```typescript
type A = Parameters<() => void>;           // []
type B = Parameters<typeof Array.isArray>; // [any]
type C = Parameters<typeof parseInt>;      // [string, (number | undefined)?]
type D = Parameters<typeof Math.max>;      // number[]
```
`Array.isArray()` 方法接收一个任意类型的参数，这也是为什么类型 `B` 被解析为 `[any]`，一个只有一个元素的元组。`Math.max()` 方法，从另一方面说，期望任意数量的参数（不是一个数组参数）。因此，类型 `D` 被解析为 `number[]` （而不是`[number[]]`）。

####  ConstructorParameters&lt;T&gt;
`ConstructorParameters<T>` 可以让我们提取构造器函数类型的所有参数，它会生成具有所有参数类型的 `tuple` 类型(或者如果T不是函数，则为never类型)。它的定义：
```typescript
/**
 * Obtain the parameters of a constructor function type in a tuple
 */
type ConstructorParameters<T extends new (...args: any[]) => any> =
  T extends new (...args: infer P) => any
    ? P
    : never;
```
注意，`ConstructorParameters<T>` 类型和 `Parameters<T>` 类型几乎是一样的，唯一去的区别就是额外的 `new` 关键词预示着函数可以当成构造函数调用。

一些用例：
```typescript
type A = ConstructorParameters<ErrorConstructor>;
// [(string | undefined)?]

type B = ConstructorParameters<FunctionConstructor>;
// string[]

type C = ConstructorParameters<RegExpConstructor>;
// [string, (string | undefined)?]
```

#### InstanceType&lt;T&gt;
`InstanceType<T>` 类型可以让我们提取构造器函数类型的返回类型，它相当于是构造器函数的 `ReturnType<T>` 类型。它的定义：
```typescript
/**
 * Obtain the return type of a constructor function type
 */
type InstanceType<T extends new (...args: any[]) => any> =
  T extends new (...args: any[]) => infer R
    ? R
    : any;
```
再次注意，`InstanceType<T>` 类型在结构上与 `ReturnType<T>` 和 `ConstructorParameters<T>` 类型非常相似。

一些用例：
```typescript
type A = InstanceType<ErrorConstructor>;    // Error
type B = InstanceType<FunctionConstructor>; // Function
type C = InstanceType<RegExpConstructor>;   // RegExp
```

### 最后
本文翻译自 `Marius Schulz`（Facebook前端开发工程师） 的 [Typescript Evolution](https://mariusschulz.com/blog/series/typescript-evolution) 系列中的第34篇，原文地址为：[Conditional Types in TypeScript](https://mariusschulz.com/blog/conditional-types-in-typescript)。如有不当的地方，烦请指出。

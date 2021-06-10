import 'source-map-support/register'
;(global as any).JSMath = {}
import {
    ArrayLiteralExpression,
    ArrowKind,
    BlockStatement,
    CallExpression,
    ClassDeclaration,
    CommonFlags,
    DeclarationStatement,
    DecoratorNode,
    Expression,
    ExpressionStatement,
    FunctionDeclaration,
    FunctionExpression,
    FunctionTypeNode,
    IdentifierExpression,
    IntegerLiteralExpression,
    MethodDeclaration,
    NamedTypeNode,
    NamespaceDeclaration,
    NewExpression,
    NodeKind,
    Parser,
    PropertyAccessExpression,
    Range,
    ReturnStatement,
    Source,
    SourceKind,
    Statement,
    StringLiteralExpression,
    TypeName,
    VariableDeclaration,
} from 'assemblyscript'
import { Transform } from 'assemblyscript/cli/transform'

const r = new Range(0, 0)
r.source = new Source(SourceKind.USER, 'src/Transform/index.ts', '/* transofrm dummy */')

let gidc = 0

export = class MyTransform extends Transform {
    afterParse(parser: Parser) {
        for (let src of this.program.sources) {
            let inject: Statement[] = []
            for (let s of src.statements) {
                inject.push(...this.handleStmt(s))
            }
            src.statements.push(...inject)
        }
    }
    handleStmt(s: Statement): Statement[] {
        if (s.kind == NodeKind.CLASSDECLARATION) {
            const clsid = gidc++
            let cls = <ClassDeclaration>s
            let listNew: DecoratorNode[] = []
            let isDriver = false
            let driverName: Expression
            let deps: Expression[] = []
            let rdeps: Expression[] = []
            let fires: Expression[] = []
            for (let decor of cls.decorators ?? []) {
                if (decor.name.kind == NodeKind.IDENTIFIER) {
                    const name = (<IdentifierExpression>decor.name).text
                    if (name == 'Driver') {
                        if (decor.args.length != 1) throw new Error('Invalid usage of `Driver`')
                        driverName = decor.args[0]
                        isDriver = true
                        cls.members.push(
                            new MethodDeclaration(
                                new IdentifierExpression('the', false, r),
                                [],
                                CommonFlags.STATIC,
                                [],
                                new FunctionTypeNode(
                                    [],
                                    new NamedTypeNode(new TypeName(cls.name, null, r), [], false, r),
                                    null,
                                    false,
                                    r
                                ),
                                new BlockStatement(
                                    [
                                        new ReturnStatement(
                                            new CallExpression(
                                                new IdentifierExpression('changetype', false, r),
                                                [new NamedTypeNode(new TypeName(cls.name, null, r), null, false, r)],
                                                [
                                                    new CallExpression(
                                                        new PropertyAccessExpression(
                                                            cls.extendsType.name.identifier,
                                                            new IdentifierExpression('_getthe', false, r),
                                                            r
                                                        ),
                                                        null,
                                                        [
                                                            new IntegerLiteralExpression(i64_new(clsid), r),
                                                            new StringLiteralExpression(cls.name.text, r),
                                                        ],
                                                        r
                                                    ),
                                                ],
                                                r
                                            ),
                                            r
                                        ),
                                    ],
                                    r
                                ),
                                r
                            )
                        )
                        cls.members.push(
                            new MethodDeclaration(
                                new IdentifierExpression('getID', false, r),
                                [],
                                CommonFlags.STATIC,
                                [],
                                new FunctionTypeNode(
                                    [],
                                    new NamedTypeNode(
                                        new TypeName(new IdentifierExpression('u64', false, r), null, r),
                                        [],
                                        false,
                                        r
                                    ),
                                    null,
                                    false,
                                    r
                                ),
                                new BlockStatement(
                                    [new ReturnStatement(new IntegerLiteralExpression(i64_new(clsid), r), r)],
                                    r
                                ),
                                r
                            )
                        )
                    } else if (name == 'Depends') {
                        if (decor.args.length != 1) throw new Error('Invalid usage of `Depends`')
                        deps.push(decor.args[0])
                    } else if (name == 'Fires') {
                        if (decor.args.length != 1) throw new Error('Invalid usage of `Fires`')
                        fires.push(decor.args[0])
                    } else if (name == 'RDepends') {
                        if (decor.args.length != 1) throw new Error('Invalid usage of `RDepends`')
                        rdeps.push(decor.args[0])
                    } else {
                        listNew.push(decor)
                    }
                } else {
                    listNew.push(decor)
                }
            }
            const ds: DeclarationStatement[] = []
            for (let meme of cls.members) {
                if ((meme.name.text == 'the' || meme.name.text == 'getID') && meme.kind == NodeKind.METHODDECLARATION) {
                    const md = <MethodDeclaration>meme
                    if (md.flags & CommonFlags.STATIC && md.body.kind == NodeKind.BLOCK) {
                        const mb = <BlockStatement>md.body
                        if (mb.statements.length == 1 && mb.statements[0].kind == NodeKind.RETURN) {
                            const mr = <ReturnStatement>mb.statements[0]
                            if (mr.value.kind == NodeKind.CALL) {
                                const mc = <CallExpression>mr.value
                                if (
                                    mc.args.length == 0 &&
                                    !mc.typeArguments &&
                                    mc.expression.kind == NodeKind.IDENTIFIER &&
                                    (<IdentifierExpression>mc.expression).text == '_implthe'
                                ) {
                                } else ds.push(meme)
                            } else ds.push(meme)
                        } else ds.push(meme)
                    } else ds.push(meme)
                } else ds.push(meme)
            }
            cls.members = ds
            if (isDriver) {
                return [
                    new ExpressionStatement(
                        new CallExpression(
                            new PropertyAccessExpression(
                                cls.extendsType.name.identifier,
                                new IdentifierExpression('register', true, r),
                                r
                            ),
                            null,
                            [
                                driverName,
                                new ArrayLiteralExpression(deps, r),
                                new ArrayLiteralExpression(rdeps, r),
                                new ArrayLiteralExpression(fires, r),
                                new IntegerLiteralExpression(i64_new(clsid), r),
                                new FunctionExpression(
                                    new FunctionDeclaration(
                                        new IdentifierExpression(
                                            '__createdriver#' + cls.extendsType.name.identifier.text,
                                            false,
                                            r
                                        ),
                                        [],
                                        CommonFlags.NONE,
                                        null,
                                        new FunctionTypeNode(
                                            [],
                                            new NamedTypeNode(
                                                new TypeName(cls.extendsType.name.identifier, null, r),
                                                null,
                                                false,
                                                r
                                            ),
                                            null,
                                            false,
                                            r
                                        ),
                                        new ExpressionStatement(
                                            new NewExpression(new TypeName(cls.name, null, r), null, [], r)
                                        ),
                                        ArrowKind.ARROW_PARENTHESIZED,
                                        r
                                    )
                                ),
                            ],
                            r
                        )
                    ),
                ]
            }
            return []
        } else if (s.kind == NodeKind.NAMESPACEDECLARATION) {
            const ns = <NamespaceDeclaration>s
            let newmembers: Statement[] = []
            for (let m of ns.members) {
                newmembers.push(...this.handleStmt(m))
            }
            ns.members.push(...newmembers)
        } else if (s.kind == NodeKind.FUNCTIONDECLARATION) {
            const fnd = <FunctionDeclaration>s
            if (fnd.name?.text == 'panic') {
                fnd.signature.returnType = new NamedTypeNode(
                    new TypeName(new IdentifierExpression('void', false, r), null, r),
                    [],
                    false,
                    r
                )
            }
        }
        return []
    }
}
